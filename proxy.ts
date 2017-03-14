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
  GraphQLFormattedError,
  responsePathAsArray,
  GraphQLResolveInfo
} from 'graphql';

import { startsWith} from './utils';

interface GraphQLResponse {
  data: any;
  errors?: [GraphQLFormattedError]
}

import { fakeSchema } from './fake_schema';

export function proxyMiddleware(url) {
  const remoteServer = graphqlFetch(url) as
    (query:String, vars?:any, opts?:any) => Promise<any>;

  return remoteServer(introspectionQuery).then(introspection => {
    // TODO: check for errors
    // TODO: handle scenario when type extended with a new interface
    const introspectionSchema = buildClientSchema(introspection.data);
    const introspectionIDL = printSchema(introspectionSchema);

    return [introspectionIDL, (serverSchema, extensionIDL, request, params) => {
      const extensionAST = parse(extensionIDL);
      const extensionFields = getExtensionFields(extensionAST);
      const schema = extendSchema(serverSchema, extensionAST);
      fakeSchema(schema);

      // TODO fail if params.operationName set
      // TODO copy headers
      const originalQuery = params.query;
      if (!originalQuery)
        return { schema };

      const query = stripQuery(schema, originalQuery, extensionFields);
      // TODO: also cleanup params
      return remoteServer(query, params.variables).then(response => {
        // TODO proxy error
        return {
          schema,
          rootValue: response.data,
          context: { errors: response.errors },
          formatError
        };
      });
    }];
  })
}

function getOriginalErrorPath(e: Error) {
  if (!(e instanceof ProxiedError)) return;
  return e.proxiedError && e.proxiedError.path;
}

export function formatError(error: GraphQLError): GraphQLFormattedError {
  if (!error) throw Error('Received null or undefined error.');
  return {
    message: error.message,
    locations: error.locations || [],
    path: getOriginalErrorPath(error.originalError) || error.path || []
  };
}

export class ProxiedError extends Error {
  proxiedError: GraphQLFormattedError;
  constructor(originalError: GraphQLFormattedError) {
    super(originalError.message);
    this.proxiedError = originalError;
  }
}

export function throwIfProxiedError(context:any, resolveInfo:GraphQLResolveInfo):void {
  let path = responsePathAsArray(resolveInfo.path);
  if (!context.errors) return;
  let error = context.errors.find(error => startsWith(error.path, path));
  if (error) throw new ProxiedError(error);
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

function stripQuery(schema, query, extensionFields) {
  const queryAST = parse(query);
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
