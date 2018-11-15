import { proxyMiddleware } from "./proxy";
import { existsSync } from "./utils";
import * as jsonfile from "jsonfile";
import { createServerApi } from "./server";
import { createIdlApi } from "./idl";
import { Source } from "graphql";
import * as path from "path";
import chalk from "chalk";
import { fakeSchema } from "./fake-schema";

export function run(opts: any) {
  let {
    fileName,
    corsOrigin,
    extendUrl,
    extend,
    headers,
    configPath,
    config,
    idl,
    log
  } = opts;
  log = log || console.log;

  const corsOptions = {};
  extendUrl = extendUrl || extend;

  corsOptions["credentials"] = true;
  corsOptions["origin"] = corsOrigin ? corsOrigin : true;

  let userIDL = idl;

  if (!userIDL) {
    const { readIDL } = createIdlApi(fileName);

    if (existsSync(fileName)) {
      userIDL = readIDL(fileName);
    } else {
      // different default IDLs for extend and non-extend modes
      let defaultFileName = extendUrl
        ? "default-extend.graphql"
        : "default-schema.graphql";
      userIDL = readIDL(path.join(__dirname, defaultFileName));
    }
  }

  const { runServer } = createServerApi({ corsOptions, opts });
  let configObj;
  try {
    configObj = config || jsonfile.readFileSync(configPath);
  } catch (err) {
    console.error(err);
    throw err;
  }

  if (extendUrl) {
    // run in proxy mode
    const url = extendUrl;
    proxyMiddleware(url, headers)
      .then(([schemaIDL, cb]) => {
        schemaIDL = new Source(schemaIDL, `Inrospection from "${url}"`);
        runServer(schemaIDL, userIDL, config, cb);
      })
      .catch(error => {
        log(chalk.red(error.stack));
        process.exit(1);
      });
  } else {
    runServer(userIDL, null, config, schema => {
      fakeSchema(schema, configObj);
      return { schema };
    });
  }
}
