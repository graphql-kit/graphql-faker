export const error = (msg, reason) => {
  console.error(msg, reason);
  throw new Error(msg);
};
