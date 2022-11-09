import { TextDecoder } from "util";
import { createWriteStream, mkdirSync } from "fs";
import { dirname, basename } from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import type { TestCase, TestResult } from "@playwright/test/reporter";
import path from "path";

export interface PlaywrightStatus {
  success: boolean;
  testsPassed: number;
  testsRun: number;
  tests: TestStatus[];
}

interface TestStatus {
  success: boolean;
  file: string;
  test: string;
  errors: string[];
  unparseable?: string;
}

interface TestSpecs {
  specs: string | any[];
  suites: any[];
}

export async function extractResults(
  output: InvokeCommandOutput,
  repeatIndex: number
) {
  const defaultResults: [TestResult] = [
    {
      retry: 0,
      workerIndex: 0,
      startTime: new Date(),
      duration: 0,
      status: "failed",
      attachments: [],
      stdout: [""],
      stderr: [""],
      steps: [],
      errors: [],
    },
  ];

  if (output.FunctionError) {
    return defaultResults;
  }
  if (!output.StatusCode || output.StatusCode > 399) {
    return defaultResults;
  }

  const responsePayload = new TextDecoder().decode(output.Payload);
  let fullResponseObject;
  try {
    fullResponseObject = JSON.parse(responsePayload);
    defaultResults[0].stdout.push(fullResponseObject.out);
    if (!fullResponseObject.success) {
      defaultResults[0].stderr.push(fullResponseObject.err);
      defaultResults[0].stderr.push(fullResponseObject.reason);
      const error = {
        message: fullResponseObject.reason,
        stack: "",
        value: "",
      };
      defaultResults[0].errors = [error];
      defaultResults[0].error = error;
    }
  } catch {
    const error = {
      message: responsePayload,
      stack: "",
      value: "",
    };
    defaultResults[0].errors = [error];
    defaultResults[0].error = error;
    defaultResults[0].stdout.push(responsePayload);
    return defaultResults;
  }

  try {
    const parsedCommandOut = JSON.parse(fullResponseObject.out);
    const statuses = [];
    const tests = findFirstTests(parsedCommandOut);
    for (const test of tests) {
      statuses.push(test.status);

      if (fullResponseObject.attachments) {
        replaceAttachmentPaths(fullResponseObject.attachments, test.results);
      }

      if (test.status !== "skipped") {
        test.retries = test.results.length;
        test.results.forEach((result: TestResult) => {
          if (result.error) {
            result.errors = [result.error];
          } else {
            result.errors = [];
          }
        });
        return test.results;
      }
    }
    if (statuses.every((s) => s === "skipped")) {
      defaultResults[0].status = "skipped";
    }
    return defaultResults;
  } catch (e) {
    console.log(`failed to parse results ${e}`, fullResponseObject);
    // Something went wrong, retun the failure object
    return defaultResults;
  }
}

// We are a bit liberal with throwing errors here. If there are too many test results around
// it means that the way we search for tests is too liberal and therefore wrong
function findFirstTests(commandOutput: TestSpecs): any {
  if (commandOutput.specs && commandOutput.specs.length > 0) {
    if (commandOutput.specs.length > 1) {
      throw new Error(`too many specs found in suite ${commandOutput}`);
    }
    return commandOutput.specs[0].tests;
  }

  if (commandOutput.suites) {
    const foundTests: TestSpecs[] = commandOutput.suites.map((s) =>
      findFirstTests(s)
    );

    if (foundTests.length > 1) {
      throw new Error(`too many test suites found ${commandOutput}`);
    }

    return foundTests[0];
  }

  throw new Error(`no tests found in results ${commandOutput}`);
}

function replaceAttachmentPaths(bucketAttachments, results) {
  for (const result of results) {
    for (const resultAttachment of result.attachments) {
      const bucketAttachment = bucketAttachments.find(
        (att) => att.file === resultAttachment.path
      );
      if (bucketAttachment) {
        resultAttachment.path = bucketAttachment.bucketKey;
      }
    }
  }
}
