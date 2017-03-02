import {
  buildSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLScalarType,
  GraphQLLeafType,
} from 'graphql';

import * as _ from 'lodash';
import * as faker from 'faker';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

const idl = `
scalar CustomType
enum EnumType {
  Value1
  Value2
  Value3
  Value4
}
type RootQueryType {
  int: Int
  float: Float
  string: String
  boolean: Boolean
  id: ID
  customType: CustomType
  enumType: EnumType
}
schema {
  query: RootQueryType
}
`;

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
const stdTypeNames = Object.keys(typeFakers);

const schema = buildSchema(idl);

_.each(schema.getTypeMap(), type => {
  if (type instanceof GraphQLScalarType && !stdTypeNames.includes(type.name))
    type.serialize = (x => x);
  if (type instanceof GraphQLObjectType && !type.name.startsWith('__'))
    addFakeProperties(type);
});

function addFakeProperties(objectType:GraphQLObjectType) {
  _.each(objectType.getFields(), field => {
    const type = field.type as GraphQLLeafType;
    if (!type)
      return;
    field.resolve = getLeafResolver(type);
  });
}

function getLeafResolver(type:GraphQLLeafType) {
  if (type instanceof GraphQLEnumType) {
    const values = type.getValues().map(x => x.value);
    return () => values[faker.random.number({min:0, max: values.length - 1})];
  }

  const typeFaker = typeFakers[type.name];
  if (typeFaker)
    return typeFaker.generator(typeFaker.defaultOptions);
  else
    return () => `<${type.name}>`;
}

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));
app.listen(9002);

console.log('http://localhost:9002/graphql');
