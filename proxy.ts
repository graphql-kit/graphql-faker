import * as graphqlFetch from 'graphql-fetch';
import {
  parse,
  extendSchema,
  buildClientSchema,
  introspectionQuery,
} from 'graphql';

import { fakeSchema } from './fake_schema';

export function proxyMiddleware(url) {
  const remoteServer = graphqlFetch(url) as
    (query:String, vars?:any, opts?:any) => Promise<any>;

  return remoteServer(introspectionQuery).then(introspection => {
    //TODO: check for errors
    const serverSchema = buildClientSchema(introspection.data);
    return (extensionIDL, request, params) => {
      const schema = extendSchema(serverSchema, parse(extensionIDL));
      fakeSchema(schema);

      //TODO fail if params.operationName set
      //TODO copy headers
      const query = params.query;
      if (!query)
        return { schema };

      return remoteServer(query, params.variables).then(responce => {
        //TODO proxy error
        return { schema, rootValue: responce.data};
      });
    };
  })
}
