global['fetch'] = require('node-fetch');

import {Response} from 'node-fetch';
import * as set from 'lodash/set.js';
import * as FetchQL from 'fetchql';
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
  DocumentNode,
} from 'graphql';

import { fakeSchema } from './fake_schema';

type RequestInfo = {
  document: DocumentNode,
  variables?: {[name: string]: any};
  operationName?: string;
  result?: any;
};

export function proxyMiddleware(url, headers) {
  const remoteServer = new FetchQL({url, headers});
  const errorPrefix = `Can't get introspection from ${url}:\n`;

  return remoteServer.query({query: introspectionQuery})
  .catch(errors => {
    if (errors[0].stack instanceof Response) {
      const errResponce = errors[0].stack;
      return errResponce.text().then(body => { throw Error(
        errorPrefix +`${errResponce.status} ${errResponce.statusText}\n${body}`
      )});
    }
    return {errors};
  })
  .then(introspection => {
    if (introspection.errors) {
      throw Error(
        errorPrefix + JSON.stringify(introspection.errors, null, 2)
      );
    }

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
          // TODO copy headers
          const query = stripQuery(schema, info.document, extensionFields);
          const variables = info.variables;
          const operationName = info.operationName;

          return remoteServer.query({
            query,
            variables,
            operationName,
          }).then(response => {
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
    // Recreate root value up to a place where original error was thrown
    // and place error as field value.
    set(rootValue, error.path, new Error(error.message))
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
  // TODO: remove unussed params from query definition
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
