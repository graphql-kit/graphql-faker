import * as set from 'lodash/set.js';
import * as graphqlFetch from 'graphql-fetch';
import {
  Kind,
  parse,
  print,
  visit,
  TypeInfo,
  printSchema,
  extendSchema,
  visitWithTypeInfo,
  buildClientSchema,
  introspectionQuery,
  GraphQLError,
  DocumentNode,
} from 'graphql';

import { fakeSchema } from './fake_schema';

type RequestInfo = {
  document: DocumentNode,
  variables?: {[name: string]: any};
  operationName?: string;
  result?: any;
};

export function proxyMiddleware(url) {
  const remoteServer = graphqlFetch(url) as
    (query:String, vars?:any, opts?:any) => Promise<any>;

  return remoteServer(introspectionQuery).then(introspection => {
    // TODO: check for errors
    // TODO: handle scenario when type extended with a new interface
    const introspectionSchema = buildClientSchema(introspection.data);
    const introspectionIDL = printSchema(introspectionSchema);

    return [introspectionIDL, (serverSchema, extensionIDL) => {
      const extensionAST = parse(extensionIDL);
      const extensionFields = getExtensionFields(extensionAST);
      const schema = extendSchema(serverSchema, extensionAST);
      fakeSchema(schema);

      return {
        schema,
        rootValue: (info: RequestInfo) => {
          // TODO fail if params.operationName set
          // TODO copy headers
          const query = stripQuery(schema, info.document, extensionFields);

          return remoteServer(query, info.variables).then(response => {
            // TODO: also cleanup params
            const rootValue = response.data;
            // TODO proxy global errors
            const [, localErrors] = splitErrors(response.errors);
            injectLocalErrors(rootValue, localErrors);
            return rootValue;
          });
        },
      };
    }];
  })
}

function splitErrors(errors) {
  const global = [];
  const local = [];

  for (const error of (errors || []))
    (error.path ? local : global).push(error);
  return [global, local];
}

function injectLocalErrors(rootValue, errors) {
  (errors || []).forEach(error =>
    set(rootValue, error.path, new GraphQLError(
      error.message,
      null, //TODO: pass location
      null,
      null,
      error.path
    ))
  );
}

function getExtensionFields(extensionAST) {
  const extensionFields = {};
  (extensionAST.definitions || []).forEach(def => {
    if (def.kind !== Kind.TYPE_EXTENSION_DEFINITION)
      return;
    const typeName = def.definition.name.value;
    // FIXME: handle multiple extends of the same type
    extensionFields[typeName] = def.definition.fields.map(field => field.name.value);
  });
  return extensionFields;
}

const typenameAST = {
  kind: Kind.FIELD,
  name: {
    kind: Kind.NAME,
    value: '__typename',
  },
};

function stripQuery(schema, queryAST, extensionFields) {
  const typeInfo = new TypeInfo(schema);

  // TODO: inline all fragments
  // FIXME: Do something with field alias
  const changedAST = visit(queryAST, visitWithTypeInfo(typeInfo, {
    [Kind.FIELD]: () => {
      const typeName = typeInfo.getParentType().name;
      const fieldName = typeInfo.getFieldDef().name;

      if ((extensionFields[typeName] || []).includes(fieldName))
        return null;
    },
    [Kind.SELECTION_SET]: {
      leave(node) {
        return {
          kind: node.kind,
          selections: [
            ...node.selections,
            typenameAST,
          ],
        };
      }
    },
  }), null);

  return print(changedAST);
}
