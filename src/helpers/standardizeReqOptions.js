import md5 from 'md5'

import { isPlainObject, mustBePlainObject } from '.'

const standardizeReqOptions = (options) => {
  options = mustBePlainObject(options)

  if (typeof options.uri !== 'string') options.uri = ''

  if (typeof options.method !== 'string') options.method = 'GET'
  options.method = options.method.toUpperCase()

  options.headers = mustBePlainObject(options.headers)

  if (!isPlainObject(options.body)) options.body = null

  const uniqueId = md5(options.method + options.uri)

  return uniqueId
}

export default standardizeReqOptions
