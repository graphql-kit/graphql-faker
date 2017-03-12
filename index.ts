import {
  buildSchema,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import { fakeSchema } from './fake_schema';

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


interface GraphQLAppliedDiretives {
  isApplied(directiveName: string): boolean;
  getAppliedDirectives(): Array<string>;
  getDirectiveArgs(directiveName: string): { [argName: string]: any };
}

const fakeDefinitionIDL = fs.readFileSync(path.join(__dirname, 'fake_definition.graphql'), 'utf-8');
let userIDL;
if (argv.file) {
  userIDL = fs.readFileSync(argv.file, 'utf-8');
} else {
  argv.file = 'schema.fake.graphql'; // default filename for output
  userIDL = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');
}

const app = express();
const bodyParser = require('body-parser');

function saveIDL(idl) {
  fs.writeFileSync(argv.file, idl);
  console.log(`✔ schema saved to "${argv.file}"`);
}

function buildFakeSchema() {
  let idl = fakeDefinitionIDL + userIDL;
  let schema = buildSchema(idl);
  fakeSchema(schema);
  return schema;
}

function updateSchema(idl) {
  userIDL = idl;
  schema = buildFakeSchema();
}

let schema = buildFakeSchema();

app.use('/graphql', graphqlHTTP(() => {
  return {
    schema,
    graphiql: true
  };
}));

app.use('/editor', express.static(path.join(__dirname, 'editor')));

app.get('/user-idl', (req, res) => {
  res.status(200).send(userIDL);
});

app.use('/user-idl', bodyParser.text());

app.post('/user-idl', (req, res) => {
  try {
    saveIDL(req.body);
    updateSchema(req.body);
    res.status(200).send('ok');
  } catch(err) {
    res.status(500).send(err.message)
  }
});

app.listen(argv.port);

console.log(`http://localhost:${argv.port}:/graphql`);
