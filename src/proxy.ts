import { Request } from 'express';
import { set as pathSet } from 'lodash';
import {
  Kind,
  print,
  visit,
  execute,
  TypeInfo,
  isAbstractType,
  visitWithTypeInfo,
  separateOperations,
  ExecutionArgs,
  GraphQLError,
} from 'graphql';

import { graphqlRequest } from './utils';

export function getProxyExecuteFn(url, headers, forwardHeaders) {
  //TODO: proxy extensions
  return (args: ExecutionArgs) => {
    const { schema, document, contextValue, operationName } = args;

    const request = (contextValue as Request);
    const proxyHeaders = Object.create(null);
    for (const name of forwardHeaders) {
      proxyHeaders[name] = request.headers[name];
    }

    const strippedAST = removeUnusedVariables(
      stripExtensionFields(schema, document),
    );

    const operations = separateOperations(strippedAST);
    const operationAST = operationName
      ? operations[operationName]
      : Object.values(operations)[0];

    return graphqlRequest(
      url,
      { ...headers, ...proxyHeaders },
      print(operationAST),
      args.variableValues,
      operationName,
    ).then(
      response => execute({ ...args, rootValue: buildRootValue(response)}),
    );
  };
}

function buildRootValue(response) {
  const rootValue = response.data || {};
  const globalErrors = [];

  for (const error of (response.errors || [])) {
    const { message, path, extensions } = error;
    if (!path) {
      globalErrors.push(error);
      continue;
    }

    const errorObj = new GraphQLError(
      message,
      undefined,
      undefined,
      undefined,
      path,
      undefined,
      extensions,
    );
    // Recreate root value up to a place where original error was thrown
    // and place error as field value.
    pathSet(rootValue, error.path, errorObj);
  }

  // TODO proxy global errors
  if (globalErrors.length !== 0)
    console.error('Global Errors:\n', globalErrors);

  return rootValue;
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

function stripExtensionFields(schema, operationAST) {
  const typeInfo = new TypeInfo(schema);

  return visit(operationAST, visitWithTypeInfo(typeInfo, {
    [Kind.FIELD]: () => {
      const fieldDef = typeInfo.getFieldDef();
      if (fieldDef.name.startsWith('__') || (fieldDef as any).isExtensionField)
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
}

function removeUnusedVariables(operationAST) {
  const seenVariables = Object.create(null);

  visit(operationAST.selectionSet, {
    [Kind.VARIABLE]: (node) => {
      seenVariables[node.name.value] = true;
    },
  });

  const variableDefinitions = (operationAST.variableDefinitions || []).filter(
    def => seenVariables[def.variable.name.value]
  );
  return {...operationAST, variableDefinitions };
}
