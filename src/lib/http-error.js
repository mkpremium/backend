
export function newHttpError(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}
