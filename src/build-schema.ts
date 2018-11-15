import * as path from "path";
import { concatAST, buildASTSchema, parse } from "graphql";

export function Schema({ IDL }: any) {
  const { readIDL } = IDL;

  function readAST(filepath) {
    return parse(readIDL(filepath));
  }

  const fakeDefinitionAST = readAST(
    path.join(__dirname, "fake_definition.graphql")
  );

  function buildServerSchema(idl) {
    var ast = concatAST([parse(idl), fakeDefinitionAST]);
    return buildASTSchema(ast);
  }

  return {
    buildServerSchema
  };
}
