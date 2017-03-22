import {
  buildSchema,
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

const DEFAULT_PORT = 9002;
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
  .describe('H', 'Specify headers to the proxied server in curl format')
  .nargs('H', 1)
  .implies('header', 'extend')
  .help('h')
  .alias('h', 'help')
  .epilog(`Examples:

  # Mock GraphQL API based on IDL and open interactive editor
  $0 ./my-idl.grqphql --open

  # Extend real data from SWAPI with faked based on extension IDL
  $0 ./ext-swapi.grqphql -e http://swapi.graphene-python.org/graphql

  # Extend real data from GitHub API with faked based on extension IDL
  $0 ./ext-gh.graphql -e https://api.github.com/graphql \\
  -H “Authorization: bearer <TOKEN>"`)
  .argv

const log = console.log;

// log(argv.header) // <- array here

let fileArg = argv._[0];
let fileName = fileArg || (argv.extend ?
  './schema_extension.faker.graphql' :
  './schema.faker.graphql');

const fakeDefinitionIDL = fs.readFileSync(path.join(__dirname, 'fake_definition.graphql'), 'utf-8');

let userIDL;
if (existsSync(fileName)) {
  userIDL = fs.readFileSync(fileName, 'utf-8');
} else if (!fileArg) {
  // different default IDLs for extend and non-extend modes
  let defaultFileName = argv.e ? 'default-extend.graphql' : 'default-schema.graphql';
  userIDL = fs.readFileSync(path.join(__dirname, defaultFileName), 'utf-8');
} else {
  log(chalk.red(`Input file ${fileName} not found`));
  process.exit(1);
}

const bodyParser = require('body-parser');

function saveIDL(idl) {
  fs.writeFileSync(fileName, idl);
  log(`${chalk.green('✚')} schema saved to ${chalk.magenta(fileName)} on ${(new Date()).toLocaleString()}`);
}

if (argv.e) {
  // run in proxy mode
  proxyMiddleware(argv.e)
    .then(([schemaIDL, cb]) => runServer(schemaIDL, userIDL, cb));
} else {
  runServer(userIDL, null, schema => {
    fakeSchema(schema)
    return {schema};
  });
}

function buildServerSchema(idl) {
  return buildSchema(idl + '\n' + fakeDefinitionIDL);
}

function runServer(schemaIDL, extensionIDL, optionsCB) {
  const app = express();

  app.use('/graphql', graphqlHTTP(() => {
    const schema = buildServerSchema(schemaIDL);

    return {
      ...optionsCB(schema, extensionIDL),
      graphiql: true,
    };
  }));

  app.get('/user-idl', (_, res) => {
    res.status(200).json({
      schemaIDL,
      extensionIDL
    });
  });

  app.use('/user-idl', bodyParser.text());

  app.post('/user-idl', (req, res) => {
    try {
      if (extensionIDL === null)
        schemaIDL = req.body;
      else
        extensionIDL = req.body;

      saveIDL(req.body);
      res.status(200).send('ok');
    } catch(err) {
      res.status(500).send(err.message)
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));

  app.listen(argv.port);

  log(`\n${chalk.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk.blue('❯')} GraphQL API:\t http://localhost:${argv.port}/graphql
  ${chalk.blue('❯')} Interactive Editor:\t http://localhost:${argv.port}/editor

  `);

  if (!fileArg) {
    log(chalk.yellow(`Default file ${chalk.magenta(fileName)} is used. ` +
    `Specify [file] parameter to change.`));
  }

  if (argv.open) {
    setTimeout(() => opn(`http://localhost:${argv.port}/editor`), 500);
  }
}
