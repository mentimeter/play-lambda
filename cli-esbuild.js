#!/usr/bin/env node

const { register } = require("esbuild-register/dist/node");
register({});
module.exports = require("./src/index.ts");
