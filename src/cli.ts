#!/usr/bin/env node

import 'core-js/shim';

import applyFaker from './index';

import * as express from 'express';
import * as chalk from 'chalk';
import * as opn from 'opn';
import * as yargs from 'yargs';

const DEFAULT_PORT = process.env.PORT || 9002;
const argv = yargs
    .usage('Usage: $0 [file]')
    .alias('p', 'port')
    .nargs('p', 1)
    .describe('p', 'HTTP Port')
    .default('p', DEFAULT_PORT)
    .alias('e', 'extend')
    .nargs('e', 1)
    .describe('e', 'URL to existing GraphQL server to extend')
    .alias('o', 'open')
    .describe('o', 'Open page with IDL editor and GraphiQL in browser')
    .alias('H', 'header')
    .describe('H', 'Specify headers to the proxied server in cURL format,' +
    'e.g.: "Authorization: bearer XXXXXXXXX"')
    .nargs('H', 1)
    .implies('header', 'extend')
    .describe(
    'forward-headers',
    'Headers that should be forwarded to the proxied server'
    )
    .array('forward-headers')
    .implies('forward-headers', 'extend')
    .alias('co', 'cors-origin')
    .nargs('co', 1)
    .describe('co', 'CORS: Define Access-Control-Allow-Origin header')
    .help('h')
    .alias('h', 'help')
    .epilog(`Examples:

  # Mock GraphQL API based on example IDL and open interactive editor
  $0 --open

  # Extend real data from SWAPI with faked data based on extension IDL
  $0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/

  # Extend real data from GitHub API with faked data based on extension IDL
  $0 ./ext-gh.graphql --extend https://api.github.com/graphql \\
  --header "Authorization: bearer <TOKEN>"`)
    .argv

const log = console.log;

const app = express();

const fileArg = argv._[0];
applyFaker(app, {
    fileArg,
    extend: argv.extend,
    header: argv.header,
    forwardHeaders: argv.forwardHeaders,
    corsOrigin: argv.corsOrigin,
})

const server = app.listen(argv.port);

const shutdown = () => {
    server.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} Interactive Editor:\t http://localhost:${argv.port}/editor
  ${chalk.blue('❯')} GraphQL API:\t http://localhost:${argv.port}/graphql

  `);

if (argv.open) {
    setTimeout(() => opn(`http://localhost:${argv.port}/editor`), 500);
}
