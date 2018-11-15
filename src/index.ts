#!/usr/bin/env node

import "core-js/shim";

import { Source } from "graphql";

import * as path from "path";
import chalk from "chalk";
import * as yargs from "yargs";
import * as jsonfile from "jsonfile";

import {
  fakeSchema,
  createFakers,
  createFakeFunctions,
  createTypeFakers,
  typeMap,
  fieldMap
} from "./fake_schema";
import { proxyMiddleware } from "./proxy";
import { existsSync } from "./utils";

import { Server } from "./server";
import { IDL } from "./idl";

export {
  fakeSchema,
  createFakers,
  createFakeFunctions,
  createTypeFakers,
  typeMap,
  fieldMap
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
        type: "boolean"
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

const fileName =
  argv.file ||
  (argv.extend ? "./schema_extension.faker.graphql" : "./schema.faker.graphql");

if (!argv.file) {
  log(
    chalk.yellow(
      `Default file ${chalk.magenta(fileName)} is used. ` +
        `Specify [file] parameter to change.`
    )
  );
}

const { readIDL } = IDL(fileName);

const corsOptions = {};

corsOptions["credentials"] = true;
corsOptions["origin"] = argv.co ? argv.co : true;

let userIDL;
if (existsSync(fileName)) {
  userIDL = readIDL(fileName);
} else {
  // different default IDLs for extend and non-extend modes
  let defaultFileName = argv.e
    ? "default-extend.graphql"
    : "default-schema.graphql";
  userIDL = readIDL(path.join(__dirname, defaultFileName));
}

const { runServer } = Server({ corsOptions, argv });

let config = {};
try {
  config = jsonfile.readFileSync(argv.config);
} catch (err) {
  console.error(err);
  throw err;
}

if (argv.e) {
  // run in proxy mode
  const url = argv.e;
  proxyMiddleware(url, headers)
    .then(([schemaIDL, cb]) => {
      schemaIDL = new Source(schemaIDL, `Inrospection from "${url}"`);
      runServer(schemaIDL, userIDL, config, cb);
    })
    .catch(error => {
      log(chalk.red(error.stack));
      process.exit(1);
    });
} else {
  runServer(userIDL, null, config, schema => {
    fakeSchema(schema, config);
    return { schema };
  });
}
