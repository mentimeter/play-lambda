import path from "path";
import { LambdaClient } from "@aws-sdk/client-lambda";
import type { TestConfig } from "./testCommand";
import { runTests } from "./testCommand";
import { listExampleProject } from "./mocks/listProjectMock";

const itintegration = () => {
  return process.env["PLAY_LAMBDA_INTEGRATION"] ? it : it.skip;
};

describe("play-lambda integration suite", () => {
  jest.setTimeout(60000);

  itintegration()("can run the full example-project suite", async () => {
    const exampleDir = path.join(__dirname, "..", "example-project");
    const lambdaClient = new LambdaClient({ region: "us-east-1" });
    const testConfig: TestConfig = {
      filePatterns: [],
      testListOverride: listExampleProject,
      runsPerTest: 1,
      configFilename: "lambda.config.ts",
      testPackageDirectory: exampleDir,
      runnerStage: "dev",
    };

    let finishedResult;
    const reporter = {
      onEnd: (result: any) => {
        finishedResult = result;
      },
    };
    const success = await runTests(testConfig, lambdaClient, reporter);

    expect(finishedResult).toEqual({ status: "passed" });
    expect(success).toBeTruthy();
  });
});
