import {
  set as pathSet,
  get as pathGet,
} from 'lodash';

import {
  Kind,
  parse,
  print,
  visit,
  execute,
  TypeInfo,
  formatError,
  extendSchema,
  isAbstractType,
  visitWithTypeInfo,
  separateOperations,
  ExecutionArgs,
} from 'graphql';

import { fakeSchema } from './fake_schema';

export function proxyMiddleware(serverRequest, serverSchema, extensionSDL) {
  const extensionAST = parse(extensionSDL);
  const extensionFields = getExtensionFields(extensionAST);
  const schema = extendSchema(serverSchema, extensionAST);
  fakeSchema(schema);

  //TODO: proxy extensions
  return {
    schema,
    customFormatErrorFn: error => ({
      ...formatError(error),
      ...pathGet(error, 'originalError.extraProps', {}),
    }),
    execute(args: ExecutionArgs) {
      const { schema, document, variableValues, operationName} = args;
      const query = stripQuery(
        schema,
        document,
        operationName,
        extensionFields,
      );

      const rootValue = serverRequest(query, variableValues, operationName)
        .then(buildRootValue);

      return execute({ ...args, rootValue });
    },
  };
}

function buildRootValue(response) {
  const rootValue = response.data || {};
  const globalErrors = [];

  for (const error of (response.errors || [])) {
    if (!error.path)
      globalErrors.push(error);

    const {message, locations: _1, path: _2, ...extraProps} = error;
    const errorObj = new Error(error.message);
    (errorObj as any).extraProps = extraProps;

    // Recreate root value up to a place where original error was thrown
    // and place error as field value.
    pathSet(rootValue, error.path, errorObj);
  }

  // TODO proxy global errors
  if (globalErrors.length !== 0)
    console.error('Global Errors:\n', globalErrors);

  return rootValue;
}

function getExtensionFields(extensionAST) {
  const extensionFields = {};

  for (const def of extensionAST.definitions) {
    if (def.kind !== Kind.OBJECT_TYPE_EXTENSION) {
      const typeName = def.name.value;

      // FIXME: handle multiple extends of the same type
      extensionFields[typeName] = def.fields.map(field => field.name.value);
    }
  }
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
