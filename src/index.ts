#!/usr/bin/env node
import "core-js/shim";
import * as path from "path";
import chalk from "chalk";
import * as yargs from "yargs";
import { run } from "./run";

import {
  fakeSchema,
  createFakers,
  createFakeFunctions,
  createTypeFakers,
  maps
} from "./fake_schema";

export { run };

export {
  fakeSchema,
  createFakers,
  createFakeFunctions,
  createTypeFakers,
  maps
};

const argv = yargs
  .command("$0 [file]", "", cmd =>
    cmd.options({
      config: {
        alias: "c",
        describe:
          "Config: The config file (JSON) that contains optional configuration object",
        type: "string",
        requiresArg: true,
        default: path.join(__dirname, "default-config.json")
      },
      port: {
        alias: "p",
        describe: "HTTP Port",
        type: "number",
        requiresArg: true,
        default: process.env.PORT || 9002
      },
      open: {
        alias: "o",
        describe: "Open page with IDL editor and GraphiQL in browser",
        type: "boolean",
        default: false
      },
      "cors-origin": {
        alias: "co",
        describe:
          "CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request",
        type: "string",
        requiresArg: true
      },
      extend: {
        alias: "e",
        describe: "URL to existing GraphQL server to extend",
        type: "string",
        requiresArg: true
      },
      header: {
        alias: "H",
        describe:
          'Specify headers to the proxied server in cURL format, e.g.: "Authorization: bearer XXXXXXXXX"',
        type: "string",
        requiresArg: true,
        implies: "extend"
      },
      "forward-headers": {
        describe:
          "Specify which headers should be forwarded to the proxied server",
        type: "array",
        implies: "extend"
      }
    })
  )
  .strict()
  .help("h")
  .alias("h", "help").epilog(`Examples:

  # Mock GraphQL API based on example IDL and open interactive editor
  $0 --open

  # Extend real data from SWAPI with faked data based on extension IDL
  $0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/

  # Extend real data from GitHub API with faked data based on extension IDL
  $0 ./ext-gh.graphql --extend https://api.github.com/graphql \\
  --header "Authorization: bearer <TOKEN>"`).argv;

const log = console.log;

let headers = {};
if (argv.header) {
  const headerStrings = Array.isArray(argv.header)
    ? argv.header
    : [argv.header];
  for (const str of headerStrings) {
    const index = str.indexOf(":");
    const name = str.substr(0, index).toLowerCase();
    const value = str.substr(index + 1).trim();
    headers[name] = value;
  }
}

// const { corsOrigin, extend, forwardHeaders, header, config, port, open } = argv;
const { file, extend } = argv;

const fileName =
  file ||
  (extend ? "./schema_extension.faker.graphql" : "./schema.faker.graphql");

if (!file) {
  log(
    chalk.yellow(
      `Default file ${chalk.magenta(fileName)} is used. ` +
        `Specify [file] parameter to change.`
    )
  );
}

run({ ...argv, extendUrl: extend, log, headers, fileName });
