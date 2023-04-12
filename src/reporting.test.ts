import path from "path";
import { TextEncoder } from "util";
import type { Reporter } from "@playwright/test/reporter";
import type { TestConfig } from "./testCommand";
import { runTests } from "./testCommand";
import {
  fullSuccessResponse,
  threeFailedRadioheadWikiTries,
} from "./mocks/resultParsingResponseMocks";
import { listExampleProject, listRadioheadWiki } from "./mocks/listProjectMock";
import { LambdaClient } from "@aws-sdk/client-lambda";

describe("playwright reporting", () => {
  let lambdaClient: Partial<LambdaClient>;
  let config: TestConfig;
  let mockReporter: Reporter;
  let onBegin: jest.Mock<any, any>;
  let onTestBegin: jest.Mock<any, any>;
  let onTestEnd: jest.Mock<any, any>;
  let onEnd: jest.Mock<any, any>;

  const makeResponse = (payload: string | undefined) => {
    return {
      $metadata: undefined,
      FunctionError: undefined,
      LogResult: undefined,
      Payload: new TextEncoder().encode(payload),
      StatusCode: 200,
    };
  };

  beforeEach(() => {
    const exampleDir = path.join(__dirname, "..", "example-project");

    lambdaClient = {
      send: async () => {
        return makeResponse(fullSuccessResponse);
      },
    };
    onBegin = jest.fn();
    onTestBegin = jest.fn();
    onTestEnd = jest.fn();
    onEnd = jest.fn();

    mockReporter = {
      onBegin,
      onTestBegin,
      onTestEnd,
      onEnd,
    };

    config = {
      filePatterns: [],
      testListOverride: listExampleProject,
      runsPerTest: 1,
      configFilename: "lambda.config.ts",
      testPackageDirectory: exampleDir,
      runnerStage: "dev",
    };
  });

  describe("lambda response parsing", () => {
    it("can parse lambda response status failures", async () => {
      const lambdaResponse = {
        $metadata: undefined,
        FunctionError: undefined,
        LogResult: undefined,
        Payload: new Uint8Array(),
        StatusCode: 418,
      };
      lambdaClient = {
        send: async () => {
          return lambdaResponse;
        },
      };

      await runTests(config, lambdaClient, mockReporter);
      expect(onEnd.mock.calls).toHaveLength(1);
      expect(onEnd.mock.calls[0][0].status).toEqual("failed");
    });

    it("fails on lambda functionerror", async () => {
      const lambdaResponse = {
        $metadata: undefined,
        FunctionError: "bad things happened",
        LogResult: undefined,
        Payload: new Uint8Array(),
        StatusCode: 200,
      };
      lambdaClient = {
        send: async () => {
          return lambdaResponse;
        },
      };

      await runTests(config, lambdaClient, mockReporter);
      expect(onEnd.mock.calls).toHaveLength(1);
      expect(onEnd.mock.calls[0][0].status).toEqual("failed");
    });
  });

  it("calls onBegin with config and suite", async () => {
    await runTests(config, lambdaClient, mockReporter);

    expect(onBegin.mock.calls).toHaveLength(1);
    const call = onBegin.mock.calls[0];
    expect(call[0].projects[0].timeout).toEqual(30000);
    expect(call[1].suites[0].suites).toHaveLength(3);
    expect(call[1].allTests()).toHaveLength(4);
  });

  it("calls onTestxxx on successfull tests", async () => {
    await runTests(config, lambdaClient, mockReporter);

    expect(onTestBegin.mock.calls).toHaveLength(4);
    expect(onTestEnd.mock.calls).toHaveLength(4);
  });

  it("calls onTestxxx the right amount of times on retried tests", async () => {
    lambdaClient = {
      send: async () => {
        return makeResponse(threeFailedRadioheadWikiTries);
      },
    };

    config.testListOverride = listRadioheadWiki;

    await runTests(config, lambdaClient, mockReporter);

    expect(onTestBegin.mock.calls).toHaveLength(3);
    expect(onTestEnd.mock.calls).toHaveLength(3);
    expect(onTestBegin.mock.calls[0][0].retries).toEqual(3);

    for (const call of onTestEnd.mock.calls) {
      expect(call[1].error.message).toContain("en.wikipedia.org/wiki/Oasis");
    }
  });

  it("calls onEnd with failure on fail", async () => {
    lambdaClient = {
      send: async () => {
        return makeResponse(threeFailedRadioheadWikiTries);
      },
    };

    config.testListOverride = listRadioheadWiki;

    await runTests(config, lambdaClient, mockReporter);

    expect(onEnd.mock.calls).toHaveLength(1);
    expect(onEnd.mock.calls[0][0].status).toEqual("failed");
  });

  it("contains the right outcomes once done", async () => {
    lambdaClient = {
      send: async () => {
        return makeResponse(threeFailedRadioheadWikiTries);
      },
    };

    config.testListOverride = listRadioheadWiki;

    await runTests(config, lambdaClient, mockReporter);

    const suite = onBegin.mock.calls[0][1];
    const tests = suite.allTests();
    expect(tests).toHaveLength(1);
    expect(tests[0].outcome()).toEqual("unexpected");
  });
});
