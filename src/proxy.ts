import fetch from 'node-fetch';
import {Headers} from 'node-fetch';
import * as set from 'lodash/set.js';

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
  const remoteServer = requestFactory(url, headers);

  return getIntrospection().then(introspection => {
    const introspectionSchema = buildClientSchema(introspection.data);
    const introspectionIDL = printSchema(introspectionSchema);

    return [introspectionIDL, (serverSchema, extensionIDL) => {
      const extensionAST = parse(extensionIDL);
      const extensionFields = getExtensionFields(extensionAST);
      const schema = extendSchema(serverSchema, extensionAST);
      fakeSchema(schema);

      //TODO: proxy extensions
      return {
        schema,
        rootValue: (info: RequestInfo) => {
          // TODO copy headers
          const query = stripQuery(schema, info.document, extensionFields);
          const variables = info.variables;
          const operationName = info.operationName;

          return remoteServer(query, variables, operationName)
            .then(buildRootValue);
        },
      };
    }];
  });

  function getIntrospection() {
    return remoteServer(introspectionQuery)
      .then(introspection => {
        if (introspection.errors)
          throw Error(JSON.stringify(introspection.errors, null, 2));
        return introspection;
      })
      .catch(error => {
        throw Error(`Can't get introspection from ${url}:\n${error.message}`);
      })
  }
}

function buildRootValue(response) {
  const rootValue = response.data;
  const globalErrors = [];

  for (const error of (response.errors || [])) {
    if (!error.path)
      globalErrors.push(error);

    // Recreate root value up to a place where original error was thrown
    // and place error as field value.
    set(rootValue, error.path, new Error(error.message))
  }

  // TODO proxy global errors
  if (globalErrors.length !== 0)
    console.error('Global Errors:\n', globalErrors);

  return rootValue;
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

      // TODO: uncomment after fragment fix
      //if (fieldName.startsWith('__'))
      //  return null;
      if ((extensionFields[typeName] || []).includes(fieldName))
        return null;
    },
    [Kind.SELECTION_SET]: {
      leave(node) {
        //HACK: remove
        const typeName = typeInfo.getParentType().name;
        if (typeName.startsWith('__'))
          return;

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

function requestFactory(url, headersObj) {
  return (query, variables?, operationName?) => {
    return fetch(url, {
      method: 'POST',
      headers: new Headers({
        "content-type": 'application/json',
        ...headersObj,
      }),
      body: JSON.stringify({
        operationName,
        query,
        variables,
      })
    }).then(responce => {
      if (responce.ok)
        return responce.json();
      return responce.text().then(body => {
        throw Error(`${responce.status} ${responce.statusText}\n${body}`);
      });
    });
  }
}
