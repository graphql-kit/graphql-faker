import * as fs from "fs";
import { Source } from "graphql";
import chalk from "chalk";

export function IDL(fileName) {
  const log = console.log;

  function readIDL(filepath) {
    return new Source(fs.readFileSync(filepath, "utf-8"), filepath);
  }

  function saveIDL(idl) {
    fs.writeFileSync(fileName, idl);
    log(
      `${chalk.green("✚")} schema saved to ${chalk.magenta(
        fileName
      )} on ${new Date().toLocaleString()}`
    );
    return new Source(idl, fileName);
  }

  return {
    readIDL,
    saveIDL
  };
}
