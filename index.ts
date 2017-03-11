import {
  buildSchema,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import { fakeSchema } from './fake_schema';

const fakeDefinitionIDL = fs.readFileSync('./fake_definition.graphql', 'utf-8');
const userIDL = fs.readFileSync('./schema.graphql', 'utf-8');
const idl = fakeDefinitionIDL + userIDL;

const schema = buildSchema(idl);
fakeSchema(schema);

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

app.use('/editor', express.static(path.join(__dirname, 'editor')));

app.get('/user-idl', (req, res) => {
  res
    .status(200).send(userIDL);
})
app.listen(9002);

console.log('http://localhost:9002/graphql');
