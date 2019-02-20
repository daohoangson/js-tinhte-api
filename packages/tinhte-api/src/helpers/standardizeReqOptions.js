import querystring from 'querystring'

import { hashMd5 } from './crypt'

const filterEmptyValueFromArray = (array) => {
  const filtered = []

  array.forEach((v) => {
    if (typeof v === 'string' && v.length === 0) {
      return
    }

    filtered.push(v)
  })

  return filtered
}

const filterEmptyKeyOrValueFromParams = (params) => {
  const filtered = {}
  Object.keys(params).forEach((k) => {
    if (k.length === 0) {
      return
    }

    let v = params[k]
    if (typeof v === 'string') {
      if (v.length === 0) {
        return
      }
    } else {
      /* istanbul ignore else */
      if (Array.isArray(v)) {
        v = filterEmptyValueFromArray(v)
        if (v.length === 0) {
          return
        }
      }
    }

    filtered[k] = v
  })

  return filtered
}

const standardizeReqOptions = (options = {}) => {
  if (typeof options.uri !== 'string') options.uri = ''
  options.params = options.params || {}
  options.headers = options.headers || {}
  if (typeof options.body === 'undefined') options.body = null
  if (typeof options.method !== 'string') options.method = (options.body ? 'POST' : 'GET')
  options.method = options.method.toUpperCase()

  let isFullUri = false
  if (options.uri.match(/^https?:\/\//) === null) {
    const uriMatches = options.uri.match(/^\/*([^?]*)(\?(.+))?$/)
    /* istanbul ignore else */
    if (uriMatches !== null) {
      options.uri = uriMatches[1]
      options.params = { ...options.params, ...querystring.parse(uriMatches[3]) }
    }
  } else {
    isFullUri = true
  }

  options.params = filterEmptyKeyOrValueFromParams(options.params)
  const paramsStringified = querystring.stringify(options.params)
  const paramsParts = paramsStringified.split(/&/).sort()
  options.paramsAsString = paramsParts.join('&')

  if (!isFullUri) {
    options.explain = `${options.method} ${options.uri}?${options.paramsAsString}`
  } else {
    // still parse query from options.uri to make sure options.param is correct
    const uriQueryMatches = options.uri.match(/\?(.+)$/)
    if (uriQueryMatches !== null) {
      options.params = { ...options.params, ...querystring.parse(uriQueryMatches[1]) }
    }

    options.explain = `${options.method} full=${options.uri} params=${options.paramsAsString}`
  }

  const uniqueId = hashMd5(options.explain)

  return uniqueId
}

export default standardizeReqOptions
