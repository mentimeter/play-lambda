import { execSync } from "child_process";
import { dirname } from "path";
import type { Suite, TestCase } from "@playwright/test/reporter";
import type {
  Project,
  PlaywrightTestOptions,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import type { SuiteInfo, TestConfig } from "./testCommand";

export async function findTests(config: TestConfig): Promise<SuiteInfo> {
  let pwListRaw: string;

  if (config.testListOverride) {
    pwListRaw = config.testListOverride;
  } else {
    try {
      // This doesn't like to be run from within jest, hence the override
      pwListRaw = execSync(
        `npx playwright test --list --reporter json ${config.filePatterns.join(
          " "
        )}`,
        {
          cwd: config.testPackageDirectory,
          input: "",
        }
      ).toString();
    } catch (error) {
      console.log(
        `Could not find any tests that match: ${config.filePatterns}`
      );
      throw new Error(
        `Command failed: npx playwright test --list --reporter json ${config.filePatterns}`
      );
    }
  }

  const allTests: TestCase[] = [];
  const rootSuite: Suite = {
    title: "", // Root suite
    project: () => undefined, // Root suite
    suites: [],
    tests: [],
    titlePath: () => {
      return [""];
    },
    allTests: () => {
      return allTests;
    },
  };

  const listOutput = JSON.parse(pwListRaw);
  const suiteInfo: SuiteInfo = {
    suite: rootSuite,
    config: listOutput.config,
  };

  const rootConfig = {
    ...listOutput.config,
    ...listOutput.config.projects[0],
  };

  const mainSuite: Suite = {
    title: "",
    project: () => {
      return rootConfig;
    },
    suites: [],
    tests: [],
    titlePath: () => {
      return ["", ""];
    },
    allTests: () => {
      return allTests;
    },
  };
  rootSuite.suites.push(mainSuite);

  const suites = getSuites(
    listOutput,
    listOutput.config,
    config.runsPerTest,
    ["", ""],
    [allTests]
  );
  mainSuite.suites = suites;

  //@ts-expect-error playwright reporters expect a _configDir on the config object
  suiteInfo.config._configDir = dirname(config.configFilename);

  // It's fun to let the user know that we are using lots of lambda functions!
  rootConfig.workers = allTests.length;
  listOutput.config.workers = allTests.length;
  listOutput.config._internal = {maxConcurrentTestGroups: allTests.length};
  rootConfig.__testGroupsCount = allTests.length;
  listOutput.config.__testGroupsCount = allTests.length;

  return suiteInfo;
}

function getSuites(
  listSuite: { suites: any },
  projectConfig:
    | Required<Project<PlaywrightTestOptions, PlaywrightWorkerOptions>>
    | undefined,
  runsPerTest: number,
  titles: string[],
  testLists: TestCase[][]
) {
  const suites = [];

  if (listSuite.suites) {
    for (const childListSuite of listSuite.suites) {
      const childTests: TestCase[] = [];
      const grandChildSuite = getSuites(
        childListSuite,
        projectConfig,
        runsPerTest,
        [...titles, childListSuite.title],
        [...testLists, childTests]
      );

      const childSuite: Suite = {
        title: childListSuite.title,
        location: {
          file: childListSuite.file,
          line: childListSuite.line,
          column: childListSuite.column,
        },
        project: () => {
          return projectConfig;
        },
        suites: grandChildSuite,
        tests: childTests,
        titlePath: () => {
          return [...titles, childListSuite.title];
        },
        allTests: () => {
          return childTests;
        },
      };

      if (childListSuite.specs) {
        for (const childSpec of childListSuite.specs) {
          for (let i = 0; i < runsPerTest; i++) {
            const test: TestCase = {
              parent: childSuite,
              title: childSpec.title,
              location: {
                file: childSpec.file,
                line: childSpec.line,
                column: childSpec.column,
              },
              expectedStatus: childSpec.tests[0].expectedStatus,
              timeout: childSpec.tests[0].timeout,
              annotations: childSpec.tests[0].annotations,
              retries: 0,
              repeatEachIndex: i,
              results: [],
              outcome: () => {
                return "expected";
              },
              ok: () => {
                return childSpec.ok;
              },
              titlePath: () => {
                return [...titles, childListSuite.title, childSpec.title];
              },
              id: "whatever",
            };
            for (const list of [...testLists, childTests]) {
              list.push(test);
            }
          }
        }
      }

      suites.push(childSuite);
    }
  }

  return suites;
}
