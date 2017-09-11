import fetch from 'node-fetch';
import {Headers} from 'node-fetch';
const set = require('lodash/set');

import {
  Kind,
  parse,
  print,
  visit,
  TypeInfo,
  printSchema,
  extendSchema,
  isAbstractType,
  visitWithTypeInfo,
  buildClientSchema,
  introspectionQuery,
  separateOperations,
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

    return [introspectionIDL, (serverSchema, extensionIDL, forwardHeaders) => {
      const extensionAST = parse(extensionIDL);
      const extensionFields = getExtensionFields(extensionAST);
      const schema = extendSchema(serverSchema, extensionAST);
      fakeSchema(schema);

      //TODO: proxy extensions
      return {
        schema,
        rootValue: (info: RequestInfo) => {
          const operationName = info.operationName;
          const variables = info.variables;
          const query = stripQuery(
            schema, info.document, operationName, extensionFields
          );

          return remoteServer(query, variables, operationName, forwardHeaders)
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

function injectTypename(node) {
  return {
    ...node,
    selections: [
      ...node.selections,
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: '__typename',
        },
      },
    ],
  };
}

function stripQuery(schema, queryAST, operationName, extensionFields) {
  const typeInfo = new TypeInfo(schema);

  const changedAST = visit(queryAST, visitWithTypeInfo(typeInfo, {
    [Kind.FIELD]: () => {
      const typeName = typeInfo.getParentType().name;
      const fieldName = typeInfo.getFieldDef().name;

      if (fieldName.startsWith('__'))
        return null;
      if ((extensionFields[typeName] || []).includes(fieldName))
        return null;
    },
    [Kind.SELECTION_SET]: {
      leave(node) {
        const type = typeInfo.getParentType()
        if (isAbstractType(type) || node.selections.length === 0)
          return injectTypename(node);
      }
    },
  }));

  let operation = extractOperation(changedAST, operationName);
  operation = removeUnusedVariables(operation);
  return print(operation);
}

function removeUnusedVariables(queryAST) {
  const seenVariables = {}
  visit(queryAST, {
    [Kind.VARIABLE_DEFINITION]: () => false,
    [Kind.VARIABLE]: (node) => {
      seenVariables[node.name.value] = true;
    },
  });

  // Need to second visit to account for variables used in fragments
  // so we make modification only when we seen all variables.
  return visit(queryAST, {
    [Kind.OPERATION_DEFINITION]: {
      leave(node) {
        const variableDefinitions = (node.variableDefinitions || []).filter(
          def => seenVariables[def.variable.name.value]
        );
        return { ...node, variableDefinitions };
      },
    },
  });
}

function extractOperation(queryAST, operationName) {
  const operations = separateOperations(queryAST);
  if (operationName)
    return operations[operationName];
  return Object.values(operations)[0];
}

function requestFactory(url, headersObj) {
  return (query, variables?, operationName?, forwardHeaders?) => {
    return fetch(url, {
      method: 'POST',
      headers: new Headers({
        "content-type": 'application/json',
        ...headersObj,
        ...forwardHeaders,
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
