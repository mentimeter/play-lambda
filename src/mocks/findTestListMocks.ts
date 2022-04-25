export const noDescribe = String.raw`{
  "config": {
    "forbidOnly": false,
    "globalSetup": null,
    "globalTeardown": null,
    "globalTimeout": 0,
    "grep": {},
    "grepInvert": null,
    "maxFailures": 0,
    "preserveOutput": "always",
    "projects": [
      {
        "outputDir": "/some/directory/path/packages/play-lambda/mock-example/test-results",
        "repeatEach": 1,
        "retries": 0,
        "name": "",
        "testDir": "/some/directory/path/packages/play-lambda/mock-example",
        "testIgnore": [],
        "testMatch": [
          "**/?(*.)@(spec|test).*"
        ],
        "timeout": 30000
      }
    ],
    "reporter": [
      [
        "json"
      ]
    ],
    "reportSlowTests": {
      "max": 5,
      "threshold": 15000
    },
    "rootDir": "/some/directory/path/packages/play-lambda/mock-example",
    "quiet": false,
    "shard": null,
    "updateSnapshots": "missing",
    "version": "1.18.0",
    "workers": 5,
    "webServer": null,
    "__testGroupsCount": 1
  },
  "suites": [
    {
      "title": "tests/beethovenWikipedia.spec.ts",
      "file": "tests/beethovenWikipedia.spec.ts",
      "line": 0,
      "column": 0,
      "specs": [
        {
          "title": "when searching for beethoven we can find his death",
          "ok": true,
          "tags": [],
          "tests": [
            {
              "timeout": 0,
              "annotations": [],
              "expectedStatus": "passed",
              "projectName": "",
              "results": [],
              "status": "skipped"
            }
          ],
          "file": "tests/beethovenWikipedia.spec.ts",
          "line": 3,
          "column": 1
        }
      ]
    }
  ],
  "errors": []
}`;
export const oneDescribe = String.raw`{
  "config": {
    "forbidOnly": false,
    "globalSetup": null,
    "globalTeardown": null,
    "globalTimeout": 0,
    "grep": {},
    "grepInvert": null,
    "maxFailures": 0,
    "preserveOutput": "always",
    "projects": [
      {
        "outputDir": "/some/directory/path/packages/play-lambda/mock-example/test-results",
        "repeatEach": 1,
        "retries": 0,
        "name": "",
        "testDir": "/some/directory/path/packages/play-lambda/mock-example",
        "testIgnore": [],
        "testMatch": [
          "**/?(*.)@(spec|test).*"
        ],
        "timeout": 30000
      }
    ],
    "reporter": [
      [
        "json"
      ]
    ],
    "reportSlowTests": {
      "max": 5,
      "threshold": 15000
    },
    "rootDir": "/some/directory/path/packages/play-lambda/mock-example",
    "quiet": false,
    "shard": null,
    "updateSnapshots": "missing",
    "version": "1.18.0",
    "workers": 5,
    "webServer": null,
    "__testGroupsCount": 1
  },
  "suites": [
    {
      "title": "tests/beethovenWikipedia.spec.ts",
      "file": "tests/beethovenWikipedia.spec.ts",
      "line": 0,
      "column": 0,
      "specs": [],
      "suites": [
        {
          "title": "wikipedia",
          "file": "tests/beethovenWikipedia.spec.ts",
          "line": 3,
          "column": 6,
          "specs": [
            {
              "title": "when searching for beethoven we can find his death",
              "ok": true,
              "tags": [],
              "tests": [
                {
                  "timeout": 0,
                  "annotations": [],
                  "expectedStatus": "passed",
                  "projectName": "",
                  "results": [],
                  "status": "skipped"
                }
              ],
              "file": "tests/beethovenWikipedia.spec.ts",
              "line": 4,
              "column": 3
            }
          ]
        }
      ]
    }
  ],
  "errors": []
}`;
export const nestedDescribe = String.raw`{
  "config": {
    "forbidOnly": false,
    "globalSetup": null,
    "globalTeardown": null,
    "globalTimeout": 0,
    "grep": {},
    "grepInvert": null,
    "maxFailures": 0,
    "preserveOutput": "always",
    "projects": [
      {
        "outputDir": "/some/directory/path/packages/play-lambda/mock-example/test-results",
        "repeatEach": 1,
        "retries": 0,
        "name": "",
        "testDir": "/some/directory/path/packages/play-lambda/mock-example",
        "testIgnore": [],
        "testMatch": [
          "**/?(*.)@(spec|test).*"
        ],
        "timeout": 30000
      }
    ],
    "reporter": [
      [
        "json"
      ]
    ],
    "reportSlowTests": {
      "max": 5,
      "threshold": 15000
    },
    "rootDir": "/some/directory/path/packages/play-lambda/mock-example",
    "quiet": false,
    "shard": null,
    "updateSnapshots": "missing",
    "version": "1.18.0",
    "workers": 5,
    "webServer": null,
    "__testGroupsCount": 1
  },
  "suites": [
    {
      "title": "tests/beethovenWikipedia.spec.ts",
      "file": "tests/beethovenWikipedia.spec.ts",
      "line": 0,
      "column": 0,
      "specs": [],
      "suites": [
        {
          "title": "wikipedia",
          "file": "tests/beethovenWikipedia.spec.ts",
          "line": 3,
          "column": 6,
          "specs": [],
          "suites": [
            {
              "title": "searching",
              "file": "tests/beethovenWikipedia.spec.ts",
              "line": 4,
              "column": 8,
              "specs": [
                {
                  "title": "when searching for beethoven we can find his death",
                  "ok": true,
                  "tags": [],
                  "tests": [
                    {
                      "timeout": 0,
                      "annotations": [],
                      "expectedStatus": "passed",
                      "projectName": "",
                      "results": [],
                      "status": "skipped"
                    }
                  ],
                  "file": "tests/beethovenWikipedia.spec.ts",
                  "line": 5,
                  "column": 5
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
}`;
