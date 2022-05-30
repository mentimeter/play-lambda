import fs from "fs/promises";
import path from "path";
import type { ExecOptions } from "child_process";
import { exec } from "child_process";

const serverlessVersion = "3.16";

function srcDir(): string {
  return path.join(__dirname, "..");
}

export async function deploy(args: any) {
  const tmpDir = path.join(process.cwd(), "lambda_deploy_dist");
  try {
    await fs.stat(tmpDir);
  } catch (e) {
    // Assume ENOENT
    await fs.mkdir(tmpDir);
  }

  try {
    await createPackageJson(tmpDir);
    await copyServerlessConfig(tmpDir);
  } catch (e) {
    console.error(
      `failed to create installation directory for play-lambda, ${e}`,
      e
    );
    process.exit(1);
  }

  console.log("Installing play-lambda function dependencies");

  try {
    await execCmd(`npm install --production`, { cwd: tmpDir });
  } catch (e) {
    console.error(`failed to install play-lambda dependencies: ${e}`, e);
    process.exit(1);
  }

  console.log("Deploying play-runner lambda function");
  let deployResult;
  try {
    deployResult = await execCmd(
      `npx serverless@${serverlessVersion} deploy --stage ${args.stage}`,
      { cwd: tmpDir }
    );
  } catch (e) {
    console.error(`failed to deploy play-lambda with serverless cli: ${e}`, e);
    process.exit(1);
  }

  console.log(deployResult);
}

async function createPackageJson(tmpDir: string) {
  const testPackage = require(`${process.cwd()}/package.json`);
  if (!testPackage.dependencies) {
    console.log(
      "Dont forget to declare your lambda dependencies as production dependencies!"
    );
    throw new Error("Production dependencies undeclared");
  }
  const dependencies = testPackage.dependencies;

  // Explicity declare the chrome-aws-lambda requirement
  dependencies["chrome-aws-lambda"] = "^10.1.0";

  const devPackage = require(path.join(srcDir(), "package.json"));
  const devDependencies = devPackage.devDependencies;

  const packageJSON = {
    name: "play-lambda-runner",
    version: "1.0",
    description: "Runs playwright tests in lambda functions",
    private: true,
    dependencies,
    devDependencies,
  };

  await fs.writeFile(
    `${tmpDir}/package.json`,
    JSON.stringify(packageJSON, null, 2)
  );
}

async function copyServerlessConfig(tmpDir: string) {
  let serverlessConfig = (
    await fs.readFile(`${srcDir()}/serverless.yml`)
  ).toString();

  if (process.env.PLAY_LAMBDA_TRACE_BUCKET) {
    serverlessConfig = serverlessConfig.replace(
      "\n  iamBucketReplace: true",
      `\n  iamRoleStatements:
  - Effect: Allow
    Action:
      - s3:PutObject
      - s3:PutObjectAcl
    Resource: "arn:aws:s3:::${process.env.PLAY_LAMBDA_TRACE_BUCKET}/*"`
    );
  } else {
    serverlessConfig = serverlessConfig.replace(
      "\n  iamBucketReplace: true",
      ""
    );
  }

  await fs.writeFile(`${tmpDir}/serverless.yml`, serverlessConfig);
  await fs.copyFile(
    `${srcDir()}/runner/index.js`,
    `${tmpDir}/play-lambda-runner.js`
  );
}

type CommandOptions = {
  encoding?: "buffer" | null;
  cwd: string;
} & ExecOptions;

function execCmd(cmd: string, options: CommandOptions) {
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        console.log({ error, stderr, stdout });
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}
