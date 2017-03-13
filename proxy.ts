import * as graphqlFetch from 'graphql-fetch';
import {
  Kind,
  parse,
  print,
  visit,
  TypeInfo,
  extendSchema,
  visitWithTypeInfo,
  buildClientSchema,
  introspectionQuery,
} from 'graphql';

import { fakeSchema } from './fake_schema';

export function proxyMiddleware(url) {
  const remoteServer = graphqlFetch(url) as
    (query:String, vars?:any, opts?:any) => Promise<any>;

  return remoteServer(introspectionQuery).then(introspection => {
    //TODO: check for errors
    //TODO: handle scenario when type extended with a new interface
    const serverSchema = buildClientSchema(introspection.data);
    return (extensionIDL, request, params) => {
      const extensionAST = parse(extensionIDL);
      const extensionFields = getExtensionFields(extensionAST);
      const schema = extendSchema(serverSchema, extensionAST);
      fakeSchema(schema);

      //TODO fail if params.operationName set
      //TODO copy headers
      const originalQuery = params.query;
      if (!originalQuery)
        return { schema };

      const query = stripQuery(schema, originalQuery, extensionFields);
      //TODO: also cleanup params
      return remoteServer(query, params.variables).then(responce => {
        //TODO proxy error
        return { schema, rootValue: responce.data};
      });
    };
  })
}

function getExtensionFields(extensionAST) {
  const extensionFields = {};
  (extensionAST.definitions || []).forEach(def => {
    if (def.kind !== Kind.TYPE_EXTENSION_DEFINITION)
      return;
    const typeName = def.definition.name.value;
    //FIXME: handle multiple extends of the same type
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

  //TODO: inline all fragments
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
