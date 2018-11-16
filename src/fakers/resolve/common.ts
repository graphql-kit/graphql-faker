const escapeStrRegexp = require("escape-string-regexp");

export function validateFunction({ method, functionName, func, data, error }) {
  if (typeof func !== "function") {
    error(`${method}: missing or invalid ${functionName} function`, {
      [functionName]: func,
      ...data
    });
  }
}

export function matchValue(value, field) {
  const regExpPattern =
    typeof value === "string" ? escapeStrRegexp(value) : value;
  const regExp = new RegExp(regExpPattern, "i");
  return regExp.test(field);
}

export function directivesObj(config) {
  const resolvers = config.resolvers || {};
  return resolvers.directives || {};
}
