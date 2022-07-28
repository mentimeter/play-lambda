import fs from "fs/promises";
import path from "path";
import { TextEncoder, inspect } from "util";
import type {
  InvokeCommandOutput,
  LambdaClientConfig,
} from "@aws-sdk/client-lambda";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
} from "@playwright/test/reporter";
import dotenv from "dotenv";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { Runner } from "@playwright/test/lib/runner";
import { register } from "esbuild-register/dist/node";
import { extractResults } from "./resultParsing";
import { findTests } from "./findTests";

// For optional aws access tokens
dotenv.config();

export interface TestConfig {
  filePatterns: string[];
  runsPerTest: number;
  configFilename: string;
  testPackageDirectory: string;
  testListOverride?: string;
  runnerStage: "dev" | "prod";
}

export interface SuiteInfo {
  suite: Suite;
  config: FullConfig;
}

export interface RunOutcome {
  test: TestCase;
  outcome: InvokeCommandOutput;
}

const fileIgnores = [
  "node_modules",
  ".gitignore",
  "tsconfig.json",
  "tsconfig.tsbuildinfo",
  ".eslintrc",
  "workspace-deps.txt",
  "package.json",
  "playwright-report",
  "test-results",
  "lambda_deploy_dist",
];

interface FileInfo {
  name: string;
  content: string;
}

// We need our files to be represented as base64 for the cases where image fixtures
// or the like need to be sent across
async function getFilesAsBase64(dir: string): Promise<FileInfo[]> {
  const rootDir = dir.slice();
  return getFilesRec(rootDir, dir);
}

async function getFilesRec(rootDir: string, dir: string): Promise<FileInfo[]> {
  let files = [];
  for await (const d of await fs.opendir(dir)) {
    if (fileIgnores.includes(d.name)) {
      continue;
    }
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      const moreFiles = await getFilesRec(rootDir, entry);
      files = files.concat(moreFiles);
    } else {
      const content = await fs.readFile(entry, { encoding: "base64" });

      files.push({
        name: path.relative(rootDir, entry),
        content,
      });
    }
  }
  return files;
}

export function prepareConfig(
  configPath: string,
  playLambdaConfig: TestConfig
): {
  globalSetup: any;
  globalTeardown: any;
  config: any;
} {
  const { unregister } = register({});
  const config = require(configPath);

  if (playLambdaConfig.runsPerTest > 1) {
    config.default.retries = 0;
  }

  let globalSetup, globalTeardown;
  if (config.default?.globalSetup) {
    globalSetup = require(config.default.globalSetup)?.default;
    delete config.default.globalSetup;
  }
  if (config.default?.globalTeardown) {
    globalTeardown = require(config.default.globalTeardown)?.default;
    delete config.default.globalTeardown;
  }
  // We unregister esbuilds machinery because playwright uses its own
  unregister();

  if (!config.default) {
    throw new Error("config file does not export a default config");
  }

  config.default.use = {
    ...config.default.use,
    launchOptions: {
      args: "REPLACE_CHROMIUM_ARGS",
      executablePath: "/tmp/chromium",
      headless: "REPLACE_CHROMIUM_HEADLESS",
    },
  };

  return {
    globalSetup,
    globalTeardown,
    config,
  };
}

export function configToConfigFile(config: { default: any }): string {
  let configString = `import chromium from 'chrome-aws-lambda';
  import type { PlaywrightTestConfig } from '@playwright/test';

  const config: PlaywrightTestConfig = ${inspect(
    config.default,
    false,
    null,
    false
  )};

  export default config;
  `;
  configString = configString.replace(
    /'REPLACE_CHROMIUM_ARGS'/g,
    "chromium.args"
  );
  configString = configString.replace(
    /'REPLACE_CHROMIUM_HEADLESS'/g,
    "chromium.headless"
  );
  return configString;
}

async function getReporterByName(name: string): Promise<Reporter> {
  const configOverride = {
    reporter: [[name]],
  };
  const reportCreatorRunner = new Runner(configOverride, {});
  return reportCreatorRunner._createReporter();
}

async function getReporterFromConfig(
  configFilepath: string
): Promise<Reporter | null> {
  // This function is the reason we need to patch playwright (for now)
  // The `Runner` class which lets us turn reporter: [['json']] type arguments
  // into actual reporter classes is internal to playwright.
  const defaultConfig = {
    reporter: [],
  };
  const reportCreatorRunner = new Runner({}, { defaultConfig });
  const configFile = Runner.resolveConfigFile(configFilepath);

  const loadedConfig = await reportCreatorRunner.loadConfigFromResolvedFile(
    configFile
  );

  if (!loadedConfig.reporter) {
    return null;
  }

  const reporter = reportCreatorRunner._createReporter();

  return reporter;
}

export async function runTests(
  config: TestConfig,
  lambdaClient: LambdaClient,
  suppliedReporter: Reporter | null
): Promise<boolean> {
  let reporter: Reporter;
  if (!suppliedReporter) {
    reporter = await getReporterByName("list");
  } else {
    reporter = suppliedReporter;
  }

  try {
    // Optimistally remove previously downloaded results if they're hanging around
    // It's the same behaviour as playwright + otherwise this dir get's pretty bloated!
    await fs.rm("test-results", { recursive: true });
  } catch (e) {
    // Don't care
  }

  const configFilepath = path.join(
    config.testPackageDirectory,
    config.configFilename
  );

  const {
    globalSetup,
    globalTeardown,
    config: playwrightConfig,
  } = prepareConfig(configFilepath, config);

  await globalSetup?.(playwrightConfig);

  const modifiedPlaywrightConfig = configToConfigFile(playwrightConfig);

  let files = await getFilesAsBase64(config.testPackageDirectory);
  files = files.map((file) => {
    if (file.name === config.configFilename) {
      file.content = Buffer.from(modifiedPlaywrightConfig).toString("base64");
    }
    return file;
  });

  // To unpack chrome on the lambda fs
  files.push({
    name: "init-chromium.js",
    content: Buffer.from(
      `const chromium = require("chrome-aws-lambda");
      (
        async () => {
          try {
            await chromium.font('https://static.mentimeter.com/static/fonts/screenshot/NotoColorEmoji.ttf');
            await chromium.executablePath
          } catch (e) {
            console.error('error initializing chromium', e);
            process.exit(1);
          }
        }
      )();`
    ).toString("base64"),
  });

  const env: any = {
    ENV: process.env.ENV ?? "stage",
  };

  if (process.env.PLAY_LAMBDA_TRACE_BUCKET) {
    env.PLAY_LAMBDA_TRACE_BUCKET = process.env.PLAY_LAMBDA_TRACE_BUCKET;
  }

  const suiteInfo = await findTests(config);

  reporter.onBegin?.(suiteInfo.config, suiteInfo.suite);

  const invocations = [];
  for (const test of suiteInfo.suite.allTests()) {
    // The search term is the concatenation of the test filename, all
    // `describe` titles and the title of the test itself. This is to ensure
    // that we get unique hits for tests with the same title string.
    const searchTerm = test
      .titlePath()
      .filter((x) => x)
      .join(" ");
    // Escape special characters which might break "--grep" or the shell command
    const escapedGrep = searchTerm.replace(/[[\]()"]/g, "\\$&");
    const lambdaRequestArgs = {
      command: `node node_modules/playwright-core/cli.js test --grep="${escapedGrep}" --config ${config.configFilename} --reporter json ${test.location.file}`,
      files,
      env,
    };

    const requestPayload = new TextEncoder().encode(
      JSON.stringify(lambdaRequestArgs)
    );
    const invokeOptions = new InvokeCommand({
      FunctionName: `play-lambda-runner-${config.runnerStage}-play-lambda-run`,
      Payload: requestPayload,
      // Can be uncommented for debug purposes
      // LogType: 'Tail',
    });

    invocations.push({
      test,
      outcome: lambdaClient.send(invokeOptions),
    });
  }

  const reportStatus: FullResult = { status: "passed" };
  await Promise.all(
    invocations.map(async (i) => {
      const finishedOutcome = await i.outcome;
      i.outcome = finishedOutcome;

      const results = await extractResults(
        finishedOutcome,
        i.test.repeatEachIndex
      );
      results.map((r) => {
        r.startTime = new Date();
        r.steps = [];
      });
      if (!results.some((r) => r.status === "passed")) {
        if (results.every((r) => r.status === "skipped")) {
          i.test.outcome = () => "skipped";
        } else {
          i.test.outcome = () => "unexpected";
          reportStatus.status = "failed";
        }
      } else if (results.some((r) => r.status === "failed")) {
        i.test.outcome = () => "flaky";
      }
      i.test.results = results;
      i.test.retries = results.length;
      for (const result of results) {
        reporter.onTestBegin?.(i.test, result);
        reporter.onTestEnd?.(i.test, result);
      }

      return i;
    })
  );

  // Some onEnds are async
  await Promise.all([
    reporter.onEnd?.(reportStatus),
    globalTeardown?.(playwrightConfig),
  ]);

  return reportStatus.status === "passed";
}

export async function testCommand(args: any) {
  const times = args.times;
  const configFile = args.config;
  const filePatterns = args.filePatterns;
  const runnerStage = args.runnerStage;

  const lambdaConfig: LambdaClientConfig = { region: "us-east-1" };
  if (process.env["PLAY_LAMBDA_ACCESS_KEY"]) {
    lambdaConfig.credentials = {
      accessKeyId: process.env["PLAY_LAMBDA_ACCESS_KEY"],
      secretAccessKey: process.env["PLAY_LAMBDA_SECRET"] ?? "",
    };

    // Set aws-used env for this process so reporting can use the same keys
    process.env["AWS_ACCESS_KEY_ID"] = process.env["PLAY_LAMBDA_ACCESS_KEY"];
    process.env["AWS_SECRET_ACCESS_KEY"] = process.env["PLAY_LAMBDA_SECRET"];
  }

  const lambdaClient = new LambdaClient(lambdaConfig);
  const testConfig: TestConfig = {
    filePatterns,
    runsPerTest: times,
    configFilename: configFile,
    testPackageDirectory: process.cwd(),
    runnerStage,
  };

  const fullConfigPath = path.join(process.cwd(), configFile);
  const reporter = await getReporterFromConfig(fullConfigPath);

  try {
    const success = await runTests(testConfig, lambdaClient, reporter);

    if (!success) {
      process.exitCode = 1;
    }
  } catch (e) {
    if (e.$response?.statusCode === 403) {
      console.error(
        "ERROR: 🚫 could not connect to AWS Lambda - are you logged in?"
      );
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}
