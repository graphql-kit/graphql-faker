import {
  buildSchema
} from 'graphql';

import * as express from 'express'
import * as graphqlHTTP from 'express-graphql'

const idl = `
type RootQueryType {
  hello: String
}
schema {
  query: RootQueryType
}
`;

const schema = buildSchema(idl);
schema.getTypeMap()['RootQueryType'].getFields()['hello'].resolve = () => 'world';

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));
app.listen(9002);

console.log('http://localhost:9002/graphql');
