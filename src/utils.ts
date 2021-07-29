import * as fs from 'fs';
import * as fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import {
  Source,
  GraphQLSchema,
  buildClientSchema,
  getIntrospectionQuery,
} from 'graphql';

export function existsSync(filePath: string): boolean {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code == 'ENOENT') return false;
  }
  return true;
}

export function readSDL(filepath: string): Source {
  return new Source(fs.readFileSync(filepath, 'utf-8'), filepath);
}

export function getRemoteSchema(
  url: string,
  headers: { [name: string]: string },
): Promise<GraphQLSchema> {
  return graphqlRequest(url, headers, getIntrospectionQuery())
    .then((response) => {
      return response.json().then((result) => {
        if (result.errors) {
          throw Error(JSON.stringify(result.errors, null, 2));
        }
        return buildClientSchema(result.data);
      });
    })
    .catch((error) => {
      throw Error(`Can't get introspection from ${url}:\n${error.message}`);
    });
}

export function graphqlRequest(
  url,
  headers,
  query,
  variables?,
  operationName?,
) {
  return fetch(url, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
      ...(headers || {}),
    }),
    body: JSON.stringify({
      operationName,
      query,
      variables,
    }),
  }).then((response) => {
    if (response.ok) return response;
    return response.text().then((body) => {
      throw Error(`${response.status} ${response.statusText}\n${body}`);
    });
  });
}
