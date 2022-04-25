import { ArgumentParser } from "argparse";
import { deploy } from "./deploy";
import { testCommand } from "./testCommand";

const RUNNER_STAGES = ["dev", "prod"];

const parser = new ArgumentParser({
  description: "Run tests in AWS lambda",
  add_help: true,
});

const subparsers = parser.add_subparsers();

const parser_deploy = subparsers.add_parser("deploy");
parser_deploy.set_defaults({ func: deploy });
parser_deploy.add_argument("stage", {
  nargs: "?",
  choices: RUNNER_STAGES,
  default: "dev",
});

const parser_test = subparsers.add_parser("test");
parser_test.set_defaults({ func: testCommand });
parser_test.add_argument("-c", "--config", {
  default: "lambda.config.ts",
  help: "config file ",
});
parser_test.add_argument("-r", "--repeat-each", { dest: "times", default: 1 });
parser_test.add_argument("-s", "--runner-stage", {
  dest: "runnerStage",
  choices: RUNNER_STAGES,
  default: "prod",
});
parser_test.add_argument("testFile", { nargs: "?", default: "tests" });

if (process.argv.length < 3) {
  parser.print_help();
  process.exit(1);
}

const args = parser.parse_args();

args.func(args);
