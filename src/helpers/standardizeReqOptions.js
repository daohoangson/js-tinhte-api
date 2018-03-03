import { filter } from 'lodash'
import md5 from 'md5'

import { isPlainObject, mustBePlainObject } from '.'

const standardizeReqOptions = (options) => {
  options = mustBePlainObject(options)

  if (typeof options.uri !== 'string') options.uri = ''
  options.uri = options.uri.replace(/^\/+/, '')
  const uriMatches = options.uri.match(/^([^?]+)\?(.+)$/)
  if (uriMatches !== null) {
    const uriPath = uriMatches[1]
    const uriQuery = uriMatches[2]
    const uriQueryParts = filter(uriQuery.split('&'), 'length').sort()
    options.uri = `${uriPath}?${uriQueryParts.join('&')}`
  }

  if (typeof options.method !== 'string') options.method = 'GET'
  options.method = options.method.toUpperCase()

  options.headers = mustBePlainObject(options.headers)

  if (!isPlainObject(options.body)) options.body = null

  const uniqueId = md5(options.method + options.uri)

  return uniqueId
}

export default standardizeReqOptions
