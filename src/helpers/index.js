export function isObject (v) {
  return v !== null && typeof v === 'object'
}

export function mustBeObject (v) {
  return isObject(v) ? v : {}
}
