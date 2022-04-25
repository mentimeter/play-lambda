import { TextEncoder } from "util";
import { extractResults } from "./resultParsing";
import {
  editorHotkeyAttachmentFailure,
  onlySkippedTests,
} from "./mocks/resultParsingResponseMocks";

describe("lambda response parsing", () => {
  const makeResponse = (payload: string) => {
    return {
      $metadata: undefined,
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
});
