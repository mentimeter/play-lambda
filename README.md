# `play-lambda` - Playwright tests in lambda functions.

Run your entire playwright test suite in aws lambda functions! `play-lambda` runs all your tests in browsers in parallel. E2E suites that used to take hours can take minutes!

This library provides a way of deploying a lambda function that can run playwright tests, and a cli that can run your e2e tests using your deployed lambda function.

It's good if you have your e2e tests in a dedicated package where you can add `play-lambda` as a dependency. It might look like the `example-project` folder in this repo.

**Disclaimer:** `play-lambda` currently does _not_ have an active maintenance policy. We attempt to keep `play-lambda` up to date with the latest version of `@playwright/test`. We rely on playwright internals to be able to run reporters correctly - and cannot guarantee that future versions of playwright won't break this.

## Deploying the `runner` lambda

`yarn play-lambda deploy {dev,prod}` installs relevant dependencies and deploys the runner lambda function to aws. The `runner` must be redeployed if any of your e2e dependencies change and when you update play-lambda.

`play-lambda` assumes that you have your aws credentials set up correctly!

You can optionally set the `PLAY_LAMBDA_TRACE_BUCKET` environment variable to configure the lambda to upload report results to a bucket aws bucket of your choice.

## Running your tests

`yarn play-lambda test` will run your full e2e suite. It will default to using a `lambda.config.ts` playwright config file. You can also run certain tests, against a different environment or each test several times using the test command:

```
➜  yarn play-lambda test --help
usage: cli.js test [-h] [-c CONFIG] [-r TIMES] [-s {dev,prod}] [testFile]

positional arguments:
  testFile

optional arguments:
  -h, --help            show this help message and exit
  -c CONFIG, --config CONFIG
                        config file
  -r TIMES, --repeat-each TIMES
  -s {dev,prod}, --runner-stage {dev,prod}
```

## Known limitations:

- Only one test can run per lambda function - once the chromium browser is closed, starting a new one normally results in errors.
- Tests can only use one browser context. Starting a second browser context will cause the lambda to crash. This is because lambdas do not allow an arbitrary amounts of processes to start.

## Developing `play-lambda`

`yarn link /path/to/play-lambda` from your e2e testing directory is useful! `yarn tsc --watch` is also fantastic.

Normal `yarn test` commands will run all unit tests here.

There is an extra `integration` suite that runs all the `example-project` tests against the actual deployed lambda function. Export the `PLAY_LAMBDA_INTEGRATION` environment variable to run these:

```
PLAY_LAMBDA_INTEGRATION=any yarn test
```

### Publishing

1. Set the version in package.json and commit
1. `export NPM_TOKEN=secret`
1. `yarn publish`
