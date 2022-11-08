const out = {
  config: {
    forbidOnly: false,
    fullyParallel: false,
    globalSetup: null,
    globalTeardown: null,
    globalTimeout: 30000,
    grep: {},
    grepInvert: null,
    maxFailures: 0,
    metadata: {},
    preserveOutput: "always",
    projects: [
      {
        outputDir: "/tmp/play-run/test-results",
        repeatEach: 1,
        retries: 2,
        id: "",
        name: "",
        testDir: "/tmp/play-run",
        testIgnore: [],
        testMatch: ["**/?(*.)@(spec|test).*"],
        timeout: 30000,
      },
    ],
    reporter: [["json", null]],
    reportSlowTests: { max: 5, threshold: 15000 },
    configFile: "/tmp/play-run/lambda.config.ts",
    rootDir: "/tmp/play-run",
    quiet: false,
    shard: null,
    updateSnapshots: "missing",
    version: "1.27.1",
    workers: 1,
    webServer: null,
  },
  suites: [
    {
      title: "tests/radioheadWikipedia.spec.ts",
      file: "tests/radioheadWikipedia.spec.ts",
      column: 0,
      line: 0,
      specs: [],
      suites: [
        {
          title: "wikipedia radiohead",
          file: "tests/radioheadWikipedia.spec.ts",
          line: 3,
          column: 6,
          specs: [
            {
              title: "searching for radiohead takes us to their page",
              ok: false,
              tags: [],
              tests: [
                {
                  timeout: 30000,
                  annotations: [],
                  expectedStatus: "passed",
                  projectId: "",
                  projectName: "",
                  results: [
                    {
                      workerIndex: 0,
                      status: "failed",
                      duration: 1283,
                      error: {
                        message: "fail is not defined",
                        stack:
                          "ReferenceError: fail is not defined\n" +
                          "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                      },
                      errors: [
                        {
                          location: {
                            file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                            column: 5,
                            line: 13,
                          },
                          message:
                            "ReferenceError: fail is not defined\n" +
                            "\n" +
                            "   at tests/radioheadWikipedia.spec.ts:13\n" +
                            "\n" +
                            "  11 |     // Press Enter\n" +
                            `  12 |     await page.press('input[name="search"]', 'Enter');\n` +
                            "> 13 |     fail();\n" +
                            "     |     ^\n" +
                            "  14 |     await expect(page).toHaveURL('https://en.wikipedia.org/wiki/Radiohead');\n" +
                            "  15 |   });\n" +
                            "  16 | });\n" +
                            "\n" +
                            "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                        },
                      ],
                      stdout: [],
                      stderr: [],
                      retry: 0,
                      startTime: "2022-11-08T09:02:01.894Z",
                      attachments: [
                        {
                          name: "trace",
                          contentType: "application/zip",
                          path: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page/trace.zip",
                        },
                      ],
                      errorLocation: {
                        file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                        column: 5,
                        line: 13,
                      },
                    },
                    {
                      workerIndex: 1,
                      status: "failed",
                      duration: 1209,
                      error: {
                        message: "fail is not defined",
                        stack:
                          "ReferenceError: fail is not defined\n" +
                          "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                      },
                      errors: [
                        {
                          location: {
                            file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                            column: 5,
                            line: 13,
                          },
                          message:
                            "ReferenceError: fail is not defined\n" +
                            "\n" +
                            "   at tests/radioheadWikipedia.spec.ts:13\n" +
                            "\n" +
                            "  11 |     // Press Enter\n" +
                            `  12 |     await page.press('input[name="search"]', 'Enter');\n` +
                            "> 13 |     fail();\n" +
                            "     |     ^\n" +
                            "  14 |     await expect(page).toHaveURL('https://en.wikipedia.org/wiki/Radiohead');\n" +
                            "  15 |   });\n" +
                            "  16 | });\n" +
                            "\n" +
                            "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                        },
                      ],
                      stdout: [],
                      stderr: [],
                      retry: 1,
                      startTime: "2022-11-08T09:02:03.990Z",
                      attachments: [
                        {
                          name: "trace",
                          contentType: "application/zip",
                          path: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry1/trace.zip",
                        },
                      ],
                      errorLocation: {
                        file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                        column: 5,
                        line: 13,
                      },
                    },
                    {
                      workerIndex: 2,
                      status: "failed",
                      duration: 1383,
                      error: {
                        message: "fail is not defined",
                        stack:
                          "ReferenceError: fail is not defined\n" +
                          "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                      },
                      errors: [
                        {
                          location: {
                            file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                            column: 5,
                            line: 13,
                          },
                          message:
                            "ReferenceError: fail is not defined\n" +
                            "\n" +
                            "   at tests/radioheadWikipedia.spec.ts:13\n" +
                            "\n" +
                            "  11 |     // Press Enter\n" +
                            `  12 |     await page.press('input[name="search"]', 'Enter');\n` +
                            "> 13 |     fail();\n" +
                            "     |     ^\n" +
                            "  14 |     await expect(page).toHaveURL('https://en.wikipedia.org/wiki/Radiohead');\n" +
                            "  15 |   });\n" +
                            "  16 | });\n" +
                            "\n" +
                            "    at /tmp/play-run/tests/radioheadWikipedia.spec.ts:13:5",
                        },
                      ],
                      stdout: [],
                      stderr: [],
                      retry: 2,
                      startTime: "2022-11-08T09:02:05.999Z",
                      attachments: [
                        {
                          name: "trace",
                          contentType: "application/zip",
                          path: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry2/trace.zip",
                        },
                      ],
                      errorLocation: {
                        file: "/tmp/play-run/tests/radioheadWikipedia.spec.ts",
                        column: 5,
                        line: 13,
                      },
                    },
                  ],
                  status: "unexpected",
                },
              ],
              id: "67474b5dfe32aaca4b12-1e4507c944ac242e4f82",
              file: "tests/radioheadWikipedia.spec.ts",
              line: 4,
              column: 3,
            },
          ],
        },
      ],
    },
  ],
  errors: [],
};

export const failedTestObject = {
  success: false,
  reason:
    'Exec command playwright command: node node_modules/playwright-core/cli.js test --grep="tests/radioheadWikipedia\\.spec\\.ts wikipedia radiohead searching for radiohead takes us to their page" --config lambda.config.ts --reporter json tests/radioheadWikipedia.spec.ts failed: Error: Command failed: node node_modules/playwright-core/cli.js test --grep="tests/radioheadWikipedia\\.spec\\.ts wikipedia radiohead searching for radiohead takes us to their page" --config lambda.config.ts --reporter json tests/radioheadWikipedia.spec.ts',
  out: JSON.stringify(out),
  err: "",
  attachments: [
    {
      file: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry1/trace.zip",
      bucketKey:
        "2022-11-08T09:02:07.559Z-bad8abe7ce527f7d1443/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry1/trace.zip",
    },
    {
      file: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry2/trace.zip",
      bucketKey:
        "2022-11-08T09:02:07.559Z-bad8abe7ce527f7d1443/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page-retry2/trace.zip",
    },
    {
      file: "/tmp/play-run/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page/trace.zip",
      bucketKey:
        "2022-11-08T09:02:07.559Z-bad8abe7ce527f7d1443/test-results/tests-radioheadWikipedia-wikipedia-radiohead-searching-for-radiohead-takes-us-to-their-page/trace.zip",
    },
  ],
};
