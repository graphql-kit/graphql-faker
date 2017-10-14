import 'core-js/shim';

import {
    Source,
    parse,
    concatAST,
    buildASTSchema,
} from 'graphql';

import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import * as chalk from 'chalk';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import { pick } from 'lodash';

import { fakeSchema } from './fake_schema';
import { proxyMiddleware } from './proxy';
import { existsSync } from './utils';

const log = console.log;

type optsType = {
    fileArg?: string,
    extend?: string,
    header?: Array<string> | string,
    forwardHeaders?: Array<string>,
    corsOrigin?: any,
}
export function applyFaker(app, {
        fileArg, extend, header, forwardHeaders, corsOrigin
    }: optsType = {}) {
    let headers = {};
    if (header) {
        const headerStrings = Array.isArray(header) ? header : [header];
        for (var str of headerStrings) {
            const index = str.indexOf(':');
            const name = str.substr(0, index);
            const value = str.substr(index + 1).trim();
            headers[name] = value;
        }
    }

    const forwardHeaderNames = (forwardHeaders || []).map(
        str => str.toLowerCase()
    );

    let fileName = fileArg || (extend ?
        './schema_extension.faker.graphql' :
        './schema.faker.graphql');
    if (!fileArg) {
        log(chalk.yellow(`Default file ${chalk.magenta(fileName)} is used. ` +
            `Specify [file] parameter to change.`));
    }

    const fakeDefinitionAST = readAST(path.join(__dirname, 'fake_definition.graphql'));
    const corsOptions = {}

    if (corsOrigin) {
        corsOptions['origin'] = corsOrigin;
        corsOptions['credentials'] = true;
    }

    let userIDL;
    if (existsSync(fileName)) {
        userIDL = readIDL(fileName);
    } else {
        // different default IDLs for extend and non-extend modes
        let defaultFileName = extend ? 'default-extend.graphql' : 'default-schema.graphql';
        userIDL = readIDL(path.join(__dirname, defaultFileName));
    }

    if (extend) {
        // run in proxy mode
        const url = extend;
        proxyMiddleware(url, headers)
            .then(([schemaIDL, cb]) => {
                schemaIDL = new Source(schemaIDL, `Inrospection from "${url}"`);
                decoServer(app, schemaIDL, userIDL, cb);
            })
            .catch(error => {
                log(chalk.red(error.stack));
                process.exit(1);
            });
    } else {
        decoServer(app, userIDL, null, schema => {
            fakeSchema(schema);
            return { schema };
        });
    }

    function readIDL(filepath) {
        return new Source(
            fs.readFileSync(filepath, 'utf-8'),
            filepath
        );
    }

    function readAST(filepath) {
        return parse(readIDL(filepath));
    }

    function saveIDL(idl, fileName) {
        fs.writeFileSync(fileName, idl);
        log(`${chalk.green('✚')} schema saved to ${chalk.magenta(fileName)} on ${(new Date()).toLocaleString()}`);
        return new Source(idl, fileName);
    }

    function buildServerSchema(idl) {
        var ast = concatAST([parse(idl), fakeDefinitionAST]);
        return buildASTSchema(ast);
    }

    // Decorate the express app
    function decoServer(app, schemaIDL: Source, extensionIDL: Source, optionsCB) {
        if (extensionIDL) {
            const schema = buildServerSchema(schemaIDL);
            extensionIDL.body = extensionIDL.body.replace('<RootTypeName>',
                schema.getQueryType().name);
        }
        app.options('/graphql', cors(corsOptions))
        app.use('/graphql', cors(corsOptions), graphqlHTTP(req => {
            const schema = buildServerSchema(schemaIDL);
            const forwardHeaders = pick(req.headers, forwardHeaderNames);
            return {
                ...optionsCB(schema, extensionIDL, forwardHeaders),
                graphiql: true,
            };
        }));

        app.get('/user-idl', (_, res) => {
            res.status(200).json({
                schemaIDL: schemaIDL.body,
                extensionIDL: extensionIDL && extensionIDL.body,
            });
        });

        app.use('/user-idl', bodyParser.text());

        app.post('/user-idl', (req, res) => {
            try {
                if (extensionIDL === null)
                    schemaIDL = saveIDL(req.body, fileName);
                else
                    extensionIDL = saveIDL(req.body, fileName);

                res.status(200).send('ok');
            } catch (err) {
                res.status(500).send(err.message);
            }
        });

        app.use('/editor', express.static(path.join(__dirname, 'editor')));
    }
}
