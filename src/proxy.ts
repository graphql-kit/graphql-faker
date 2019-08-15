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
    ).then(result => proxyResponse(result, args));
  };
}

function proxyResponse(response, args) {
  const rootValue = response.data || {};
  const globalErrors = [];

  for (const error of (response.errors || [])) {
    const { message, path, extensions } = error;
    const errorObj = new GraphQLError(
      message,
      undefined,
      undefined,
      undefined,
      path,
      undefined,
      extensions,
    );

    if (!path) {
      globalErrors.push(errorObj);
      continue;
    }

    // Recreate root value up to a place where original error was thrown
    // and place error as field value.
    pathSet(rootValue, error.path, errorObj);
  }

  if (globalErrors.length !== 0) {
    return { errors: globalErrors };
  }

  return execute({ ...args, rootValue });
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

function removeUnusedVariables(documentAST) {
  const seenVariables = Object.create(null);

  visit(documentAST, {
    [Kind.VARIABLE_DEFINITION]: () => false,
    [Kind.VARIABLE]: (node) => {
      console.log(node);
      seenVariables[node.name.value] = true;
    },
  });

  return visit(documentAST, {
    [Kind.VARIABLE_DEFINITION]: (node) => {
      if (!seenVariables[node.variable.name.value]) {
        return null;
      }
    }
  });
}
