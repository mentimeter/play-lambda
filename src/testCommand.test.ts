import path from "path";
import { TextEncoder, TextDecoder } from "util";
import type { Reporter } from "@mentimeter/playwright-test/reporter";
import type { TestConfig } from "./testCommand";
import { runTests, prepareConfig, configToConfigFile } from "./testCommand";
import { listExampleProject } from "./mocks/listProjectMock";

interface LambdaMockT {
  send: {
    mock: {
      calls: any;
    };
  };
}

describe("config manipulation", () => {
  const configPath = path.join(
    __dirname,
    "..",
    "example-project",
    "lambda.config.ts"
  );
  const playLambdaConfig: TestConfig = {
    fileNameSearch: "",
    testListOverride: listExampleProject,
    runsPerTest: 1,
    configFilename: "lambda.config.ts",
    testPackageDirectory: "",
    runnerStage: "dev",
  };

  it("adds chrome options", () => {
    const { config } = prepareConfig(configPath, playLambdaConfig);
    expect(config.default.use.launchOptions.executablePath).toEqual(
      "/tmp/chromium"
    );
    expect(config.default.use.launchOptions.args).toEqual(
      "REPLACE_CHROMIUM_ARGS"
    );
    expect(config.default.use.launchOptions.headless).toEqual(
      "REPLACE_CHROMIUM_HEADLESS"
    );
  });

  it("returns and removes globalSetup/tearDown", () => {
    const { globalSetup, globalTeardown, config } = prepareConfig(
      configPath,
      playLambdaConfig
    );
    expect(config.default.globalSetup).toEqual(undefined);
    expect(config.default.globalTeardown).toEqual(undefined);
    expect(globalSetup).not.toBeNull();
    expect(globalTeardown).not.toBeNull();
  });

  it("correctly transforms config back to a config file", () => {
    const { config } = prepareConfig(configPath, playLambdaConfig);
    const configFile = configToConfigFile(config);
    expect(configFile).toContain(`import chromium from 'chrome-aws-lambda'`);
    expect(configFile).toContain(`chromium.args`);
    expect(configFile).toContain(`chromium.headless`);
    expect(configFile).toContain(`const config: PlaywrightTestConfig = {`);
    expect(configFile).toContain(`export default config;`);
  });
});

describe("play-lambda test command", () => {
  let lambdaClient;
  let config: TestConfig;
  let muteReporter: Reporter;

  beforeEach(() => {
    const exampleDir = path.join(__dirname, "..", "example-project");
    const sendMock = jest.fn();
    lambdaClient = {
      send: sendMock,
    };

    sendMock.mockResolvedValue({
      $metadata: undefined,
      FunctionError: undefined,
      LogResult: undefined,
      Payload: new TextEncoder().encode(""),
      StatusCode: 200,
    });

    config = {
      fileNameSearch: "",
      testListOverride: listExampleProject,
      runsPerTest: 1,
      configFilename: "lambda.config.ts",
      testPackageDirectory: exampleDir,
      runnerStage: "dev",
    };

    muteReporter = {
      onBegin: () => {},
      onTestBegin: () => {},
      onTestEnd: () => {},
      onEnd: () => {},
    };
  });

  it("defaults to testing one test per lambda", async () => {
    await runTests(config, lambdaClient, muteReporter);

    expect(lambdaClient.send.mock.calls).toHaveLength(4);

    let commands = getSentCommands(lambdaClient);
    commands = commands.map((c) => c.split(" ").at(-1));
    expect(commands).toEqual(
      expect.arrayContaining([
        "tests/checkDuckFooter.spec.ts",
        "tests/checkDuckFooter.spec.ts",
        "tests/beethovenWikipedia.spec.ts",
        "tests/radioheadWikipedia.spec.ts",
      ])
    );
  });

  it("runs each test 2 times if we ask it to", async () => {
    config.runsPerTest = 2;
    await runTests(config, lambdaClient, muteReporter);

    expect(lambdaClient.send.mock.calls.length).toBe(8);

    let commands = getSentCommands(lambdaClient);
    commands = commands.map((c) => c.split(" ").at(-1));
    expect(commands).toEqual(
      expect.arrayContaining([
        "tests/checkDuckFooter.spec.ts",
        "tests/checkDuckFooter.spec.ts",
        "tests/beethovenWikipedia.spec.ts",
        "tests/radioheadWikipedia.spec.ts",
        "tests/checkDuckFooter.spec.ts",
        "tests/checkDuckFooter.spec.ts",
        "tests/beethovenWikipedia.spec.ts",
        "tests/radioheadWikipedia.spec.ts",
      ])
    );
  });

  it("retries only once with more than 1 run per test", async () => {
    config.runsPerTest = 2;
    await runTests(config, lambdaClient, muteReporter);

    expect(lambdaClient.send.mock.calls.length).toBe(8);

    const fileGroups = getSentFiles(lambdaClient);

    fileGroups.map((files) => {
      files.map((file) => {
        if (file.name.endsWith("config.ts")) {
          const fileContent = Buffer.from(file.content, "base64").toString();
          expect(fileContent).toContain("retries: 0");
        }
      });
    });
  });
});

function getSentCommands(lambdaMock: LambdaMockT) {
  const commands = [];
  for (const call of lambdaMock.send.mock.calls) {
    const payload = call[0].input.Payload;
    const payloadString = new TextDecoder().decode(payload);
    const parsedPayload = JSON.parse(payloadString);
    commands.push(parsedPayload.command);
  }

  return commands;
}

function getSentFiles(lambdaMock: LambdaMockT) {
  const files = [];
  for (const call of lambdaMock.send.mock.calls) {
    const payload = call[0].input.Payload;
    const payloadString = new TextDecoder().decode(payload);
    const parsedPayload = JSON.parse(payloadString);
    files.push(parsedPayload.files);
  }

  return files;
}

export {};
