import {
  buildSchema,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import { fakeSchema } from './fake_schema';
import { proxyMiddleware } from './proxy';

import * as opn from 'opn';

const DEFAULT_PORT = 9002;
const argv = require('yargs')
  .usage('$0 command')
  .alias('p', 'port')
  .nargs('p', 1)
  .describe('p', 'HTTP Port')
  .default('p', DEFAULT_PORT)
  .command(
    'edit [file]',
    'Open an editor and edit specified IDL file',
    yargs => {
      // wait for server to start
      setTimeout(() => {
        opn(`http://localhost:${yargs.argv.p || DEFAULT_PORT}/editor`)
      }, 0);
    }
  )
  .command(
    'start [file]',
    'Start the mocking server for specified IDL file'
  )
  .help('h')
  .alias('h', 'help')
  .argv

const fakeDefinitionIDL = fs.readFileSync(path.join(__dirname, 'fake_definition.graphql'), 'utf-8');
let userIDL;
if (argv.file) {
  userIDL = fs.readFileSync(argv.file, 'utf-8');
} else {
  argv.file = 'schema.fake.graphql'; // default filename for output
  userIDL = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');
}

const bodyParser = require('body-parser');

function saveIDL(idl) {
  fs.writeFileSync(argv.file, idl);
  console.log(`✔ schema saved to "${argv.file}"`);
}

//runServer(userIDL, idl => {
//  let schema = buildSchema(idl);
//  fakeSchema(schema);
//  return { schema };
//});

userIDL = `
  extend type Person {
    pet: String @fake(type: imageUrl, options: { imageCategory: cats})
  }
`;

proxyMiddleware('http://localhost:54464')
  .then(cb => runServer(userIDL, cb));

function runServer(idl, optionsCB) {
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

      const optionsPromise = new Promise(resolve => resolve(
        optionsCB(idl + '\n' + fakeDefinitionIDL, request, params)
      ));

      return optionsPromise.then(options => ({
        ...options,
        graphiql: true,
      }));
    });
  }));

  app.get('/user-idl', (req, res) => {
    res.status(200).send(idl);
  });

  app.use('/user-idl', bodyParser.text());

  app.post('/user-idl', (req, res) => {
    try {
      idl = req.body;
      saveIDL(req.body);
      res.status(200).send('ok');
    } catch(err) {
      res.status(500).send(err.message)
    }
  });

  app.use('/editor', express.static(path.join(__dirname, 'editor')));

  app.listen(argv.port);

  console.log(`http://localhost:${argv.port}/graphql`);
}
