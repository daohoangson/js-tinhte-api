import { isPlainObject as _isPlainObject } from 'lodash'

export function isPlainObject (v) {
  return _isPlainObject(v)
}

export function mustBePlainObject (v) {
  return isPlainObject(v) ? v : {}
}
