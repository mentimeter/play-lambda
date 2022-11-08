import { TextEncoder } from "util";
import { extractResults } from "./resultParsing";
import { failedTestObject } from "./mocks/failedTest";
import {
  editorHotkeyAttachmentFailure,
  onlySkippedTests,
} from "./mocks/resultParsingResponseMocks";
import { InvokeCommandOutput } from "@aws-sdk/client-lambda";

describe("lambda response parsing", () => {
  const makeResponse = (payload: string): InvokeCommandOutput => {
    return {
      $metadata: {},
      FunctionError: undefined,
      LogResult: undefined,
      Payload: new TextEncoder().encode(payload),
      StatusCode: 200,
    };
  };

  it("can parse results when lambda attachment uploading failed", async () => {
    const results = await extractResults(
      makeResponse(editorHotkeyAttachmentFailure),
      0
    );
    // As long as it doesn't hit the `defaultFailure` case we can assume the rest was okay
    // for the purposes of this test
    expect(results).toHaveLength(4);
  });

  it("sets the result to skipped if all tests are skipped", async () => {
    const results = await extractResults(makeResponse(onlySkippedTests), 0);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("skipped");
  });

  it("sets attachment paths = bucketKey", async () => {
    const results = await extractResults(
      makeResponse(JSON.stringify(failedTestObject)),
      0
    );

    expect(results).toHaveLength(3);
    expect(results[0].attachments[0].path).toBe(
      "2022-11-08T09:02:07.559Z-bad8abe7ce527f7d1443/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page/trace.zip"
    );
  });
});
