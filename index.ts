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
  .usage('$0 [file]')
  .alias('p', 'port')
  .nargs('p', 1)
  .describe('p', 'HTTP Port')
  .default('p', DEFAULT_PORT)
  .alias('e', 'extend')
  .nargs('e', 1)
  .describe('e', 'URL to existing GraphQL server to extend')
  .alias('o', 'open')
  .describe('o', 'Open page with IDL editor and GraphiQL in browser')
  .help('h')
  .alias('h', 'help')
  .argv

const log = console.log;

let inputFile = argv._[0];
let ouputFile = inputFile || './schema.fake.graphql';

const fakeDefinitionIDL = fs.readFileSync(path.join(__dirname, 'fake_definition.graphql'), 'utf-8');
let userIDL;
if (inputFile && existsSync(inputFile)) {
  userIDL = fs.readFileSync(inputFile, 'utf-8');
} else {
  // different default IDLs for extend and non-extend modes
  let defaultFileName = argv.e ? 'default-extend.graphql' : 'default-schema.graphql';
  userIDL = fs.readFileSync(path.join(__dirname, defaultFileName), 'utf-8');
}

const bodyParser = require('body-parser');

function saveIDL(idl) {
  fs.writeFileSync(ouputFile, idl);
  log(`${chalk.green('✚')} schema saved to ${chalk.magenta(ouputFile)} on ${(new Date()).toLocaleString()}`);
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

  app.use('/graphql', graphqlHTTP(request => {
    return (graphqlHTTP as any).getGraphQLParams(request).then(params => {
      // Dirty hack until graphql-express is splitted into multiple middlewares:
      // https://github.com/graphql/express-graphql/issues/113
      if (params.operationName === 'null')
        params.operationName = null;
      if (params.raw === false)
        params.raw = undefined;
      request.body = params;

      const schema = buildServerSchema(schemaIDL);
      const optionsPromise = new Promise(resolve => resolve(
        optionsCB(schema, extensionIDL, request, params)
      ));

      return optionsPromise.then(options => ({
        ...options,
        graphiql: true,
      }));
    });
  }));

  app.get('/user-idl', (req, res) => {
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

  if (argv.open) {
    setTimeout(() => opn(`http://localhost:${argv.port}/editor`), 500);
  }
}
