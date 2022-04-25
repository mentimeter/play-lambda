import { findTests } from "./findTests";
import {
  noDescribe,
  oneDescribe,
  nestedDescribe,
} from "./mocks/findTestListMocks";
import { listExampleProject } from "./mocks/listProjectMock";
import type { TestConfig } from "./testCommand";

const defaultConfig: TestConfig = {
  fileNameSearch: "",
  runsPerTest: 1,
  configFilename: "dontcare",
  testPackageDirectory: "dontcare",
  runnerStage: "dev",
};

describe("finding tests in suite", () => {
  it("sets the number of workers = number of tests", async () => {
    const config = {
      ...defaultConfig,
      testListOverride: listExampleProject,
    };
    const suiteInfo = await findTests(config);
    expect(suiteInfo.config.workers).toEqual(4);
    // Playwright has a special extra count for choosing how many workers
    //@ts-expect-error we know that this isn't defined on the type
    expect(suiteInfo.config.__testGroupsCount).toEqual(4);
  });

  describe("repeat-each", () => {
    it("creates 2 suites when they should be repeated", async () => {
      const config = {
        ...defaultConfig,
        testListOverride: noDescribe,
        runsPerTest: 2,
      };

      const suiteInfo = await findTests(config);

      const tests = suiteInfo.suite.allTests();
      expect(tests).toHaveLength(2);
      expect(tests[0].repeatEachIndex).toEqual(0);
      expect(tests[0].titlePath()).toEqual([
        "",
        "",
        "tests/beethovenWikipedia.spec.ts",
        "when searching for beethoven we can find his death",
      ]);
      expect(tests[1].repeatEachIndex).toEqual(1);
      expect(tests[1].titlePath()).toEqual([
        "",
        "",
        "tests/beethovenWikipedia.spec.ts",
        "when searching for beethoven we can find his death",
      ]);
    });
  });

  describe("describe blocks", () => {
    it("can find tests with no describe", async () => {
      const config = {
        ...defaultConfig,
        testListOverride: noDescribe,
      };

      const suiteInfo = await findTests(config);

      const tests = suiteInfo.suite.allTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].titlePath()).toEqual([
        "",
        "",
        "tests/beethovenWikipedia.spec.ts",
        "when searching for beethoven we can find his death",
      ]);
    });

    it("can find tests with one describe", async () => {
      const config = {
        ...defaultConfig,
        testListOverride: oneDescribe,
      };

      const suiteInfo = await findTests(config);

      const tests = suiteInfo.suite.allTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].titlePath()).toEqual([
        "",
        "",
        "tests/beethovenWikipedia.spec.ts",
        "wikipedia",
        "when searching for beethoven we can find his death",
      ]);
    });

    it("can find tests with nested describe blocks", async () => {
      const config = {
        ...defaultConfig,
        testListOverride: nestedDescribe,
      };

      const suiteInfo = await findTests(config);

      const tests = suiteInfo.suite.allTests();
      expect(tests).toHaveLength(1);
      expect(tests[0].titlePath()).toEqual([
        "",
        "",
        "tests/beethovenWikipedia.spec.ts",
        "wikipedia",
        "searching",
        "when searching for beethoven we can find his death",
      ]);
    });
  });
});
