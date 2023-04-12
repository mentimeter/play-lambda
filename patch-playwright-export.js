const fs = require("fs");

let pwPackagePath = "node_modules/@playwright/test/package.json";
let recursiveLevel = "";
let found = false;
for (let i = 0; i < 3; i++) {
  if (fs.existsSync(pwPackagePath)) {
    found = true;
    break;
  }

  recursiveLevel += "../";
  pwPackagePath = recursiveLevel + pwPackagePath;
}

if (!found) {
  throw new Error(
    "no @playwright/test package json found for export modification"
  );
}

const pwPackageString = fs.readFileSync(pwPackagePath).toString();

const pwPackage = JSON.parse(pwPackageString);

pwPackage.exports["./lib/runner/runner"] = "./lib/runner/runner.js";
pwPackage.exports["./lib/runner/reporters"] = "./lib/runner/reporters.js";
pwPackage.exports["./lib/common/configLoader"] = "./lib/common/configLoader.js";

fs.writeFileSync(pwPackagePath, JSON.stringify(pwPackage, null, 2) + "\n");
