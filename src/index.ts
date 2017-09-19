#!/usr/bin/env node

import 'core-js/shim';

import {
  Source,
  parse,
  concatAST,
  buildASTSchema,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as chalk from 'chalk';

import { fakeSchema } from './fake_schema';
import { proxyMiddleware } from './proxy';
import { existsSync } from './utils';

import * as opn from 'opn';

const cors = require('cors');
const pick = require('lodash/pick');

const DEFAULT_PORT = process.env.PORT || 9002;
const argv = require('yargs')
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

let headers = {};
if (argv.header) {
  const headerStrings = Array.isArray(argv.header) ? argv.header : [argv.header];
  for (var str of headerStrings) {
    const index = str.indexOf(':');
    const name = str.substr(0, index);
    const value = str.substr(index + 1).trim();
    headers[name] = value;
  }
}

const forwardHeaderNames = (argv.forwardHeaders || []).map(
  str => str.toLowerCase()
);

let fileArg = argv._[0];
let fileName = fileArg || (argv.extend ?
  './schema_extension.faker.graphql' :
  './schema.faker.graphql');

const fakeDefinitionAST = readAST(path.join(__dirname, 'fake_definition.graphql'));
const corsOptions = {}

if (argv.co) {
  corsOptions['origin'] =  argv.co
  corsOptions['credentials'] =  true
}

let userIDL;
if (existsSync(fileName)) {
  userIDL = readIDL(fileName);
} else {
  // different default IDLs for extend and non-extend modes
  let defaultFileName = argv.e ? 'default-extend.graphql' : 'default-schema.graphql';
  userIDL = readIDL(path.join(__dirname, defaultFileName));
}

const bodyParser = require('body-parser');

function readIDL(filepath) {
  return new Source(
    fs.readFileSync(filepath, 'utf-8'),
    filepath
  );
}

function readAST(filepath) {
  return parse(readIDL(filepath));
}

function saveIDL(idl) {
  fs.writeFileSync(fileName, idl);
  log(`${chalk.green('✚')} schema saved to ${chalk.magenta(fileName)} on ${(new Date()).toLocaleString()}`);
  return new Source(idl, fileName);
}

if (argv.e) {
  // run in proxy mode
  const url = argv.e;
  proxyMiddleware(url, headers)
    .then(([schemaIDL, cb]) => {
      schemaIDL = new Source(schemaIDL, `Inrospection from "${url}"`);
      runServer(schemaIDL, userIDL, cb)
    })
    .catch(error => {
      log(chalk.red(error.stack));
      process.exit(1);
    });
} else {
  runServer(userIDL, null, schema => {
    fakeSchema(schema)
    return {schema};
  });
}

function buildServerSchema(idl) {
  var ast = concatAST([parse(idl), fakeDefinitionAST]);
  return buildASTSchema(ast);
}

function runServer(schemaIDL: Source, extensionIDL: Source, optionsCB) {
  const app = express();

  if (extensionIDL) {
    const schema = buildServerSchema(schemaIDL);
    extensionIDL.body = extensionIDL.body.replace('<RootTypeName>', schema.getQueryType().name);
  }
  app.options('/graphql', cors(corsOptions))
  app.use('/graphql', cors(corsOptions), graphqlHTTP(req => {
    const schema = buildServerSchema(schemaIDL);
    const forwardHeaders = pick(req.headers, forwardHeaderNames);
    return {
      ...optionsCB(schema, extensionIDL, forwardHeaders),
      graphiql: true,
    };
  }));

  app.get('/user-idl', (_, res) => {
    res.status(200).json({
      schemaIDL: schemaIDL.body,
      extensionIDL: extensionIDL && extensionIDL.body,
    });
  });

  app.use('/user-idl', bodyParser.text());

  app.post('/user-idl', (req, res) => {
    try {
      if (extensionIDL === null)
        schemaIDL = saveIDL(req.body);
      else
        extensionIDL = saveIDL(req.body);

      res.status(200).send('ok');
    } catch(err) {
      res.status(500).send(err.message)
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));

  const server = app.listen(argv.port);

  const shutdown = () => {
    server.close();
    process.exit(0);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} Interactive Editor:\t http://localhost:${argv.port}/editor
  ${chalk.blue('❯')} GraphQL API:\t http://localhost:${argv.port}/graphql

  `);

  if (!fileArg) {
    log(chalk.yellow(`Default file ${chalk.magenta(fileName)} is used. ` +
    `Specify [file] parameter to change.`));
  }

  if (argv.open) {
    setTimeout(() => opn(`http://localhost:${argv.port}/editor`), 500);
  }
}
