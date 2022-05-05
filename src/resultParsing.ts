import { TextDecoder } from "util";
import { createWriteStream, mkdirSync } from "fs";
import { dirname, basename } from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { InvokeCommandOutput } from "@aws-sdk/client-lambda";
import type { TestCase, TestResult } from "@playwright/test/reporter";

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

      if (
        test.results.some((r: TestResult) => r.attachments) &&
        fullResponseObject.attachments
      ) {
        await downloadAttachments(
          test,
          fullResponseObject.attachments,
          repeatIndex
        );
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

async function downloadAttachments(
  test: TestCase,
  attachments: any[],
  repeatIndex: number
) {
  if (!process.env.PLAY_LAMBDA_TRACE_BUCKET) {
    return;
  }

  const s3 = new S3Client({ region: "us-east-1" });
  const lambdaRunDirectory = "/tmp/play-run/";
  const bucket = process.env.PLAY_LAMBDA_TRACE_BUCKET;

  // Downloads attachments in parallel
  await Promise.all(
    test.results.map(async (r) => {
      if (r.attachments.length === 0) {
        return;
      }
      return Promise.all(
        r.attachments.map(async (resultAttachment) => {
          const remoteAttachment = attachments.find(
            (a) => a.file === resultAttachment.path
          );
          if (!remoteAttachment) {
            // We still want the rest of the result parsing to succeed even if the lambda had problems with this attachment
            return;
          }

          resultAttachment.path = resultAttachment.path.replace(
            lambdaRunDirectory,
            ""
          );

          if (repeatIndex > 0) {
            // test-results/name-of-test-runx/trace.zip
            resultAttachment.path = `${dirname(
              resultAttachment.path
            )}-run${repeatIndex}/${basename(resultAttachment.path)}`;
          }

          const response = await s3.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: remoteAttachment.bucketKey,
            })
          );

          mkdirSync(dirname(resultAttachment.path), { recursive: true });

          const streamWriter = createWriteStream(resultAttachment.path);
          //@ts-expect-error Body is a stream
          response.Body.pipe(streamWriter);

          return new Promise<void>((resolve) => {
            streamWriter.on("finish", () => {
              resolve();
            });
            streamWriter.on("error", (err) => {
              console.log(`failed to download ${remoteAttachment}, ${err}`);
              resolve();
            });
          });
        })
      );
    })
  );
}
