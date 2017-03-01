import {
  buildSchema,
  GraphQLObjectType,
  GraphQLScalarType,
} from 'graphql';

import * as _ from 'lodash';
import * as faker from 'faker';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

const idl = `
scalar CustomType
type RootQueryType {
  int: Int
  float: Float
  string: String
  boolean: Boolean
  id: ID
  customType: CustomType
}
schema {
  query: RootQueryType
}
`;

const stdTypeNames = [
  'Int',
  'Float',
  'String',
  'Boolean',
  'ID',
];

const typeFakers = {
  'Int': {
    defaultOptions: {min: 0, max: 99999},
    generator: (options) => {
      options.precision = 1;
      return () => faker.random.number(options);
    }
  },
  'Float': {
    defaultOptions: {min: 0, max: 99999, precision: 0.01},
    generator: (options) => {
      return () => faker.random.number(options);
    }
  },
  'String': {
    defaultOptions: {},
    generator: (options) => {
      return () => 'string';
    }
  },
  'Boolean': {
    defaultOptions: {},
    generator: (options) => {
      return () => faker.random.boolean();
    }
  },
  'ID': {
    defaultOptions: {},
    generator: (options) => {
      return () =>
        new Buffer(
          faker.random.number({max: 9999999999}).toString()
        ).toString('base64');
    }
  },
};

const schema = buildSchema(idl);

_.each(schema.getTypeMap(), type => {
  if (type instanceof GraphQLScalarType && !stdTypeNames.includes(type.name))
    type.serialize = (x => x);
});

const rootType = schema.getType('RootQueryType') as GraphQLObjectType;
_.each(rootType.getFields(), field => {
  const type = field.type as GraphQLScalarType;
  const typeFaker = typeFakers[type.name];
  if (typeFaker)
    field.resolve = typeFaker.generator(typeFaker.defaultOptions);
  else
    field.resolve = () => `<${type.name}>`;
});

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));
app.listen(9002);

console.log('http://localhost:9002/graphql');
