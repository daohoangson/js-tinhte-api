import { parse, stringify } from 'querystring'
import { FetchOptions, FetchParams, StandardizedFetchOptions } from '../fetches/types'

import { hashMd5 } from './crypt'

const filterEmptyValueFromArray = (array: string[]): string[] => {
  const filtered: string[] = []

  for (const value of array) {
    if (value.length > 0) {
      filtered.push(value)
    }
  }

  return filtered
}

const filterEmptyKeyOrValueFromParams = (params: FetchParams): FetchParams => {
  const filtered: FetchParams = {}
  for (const key in params) {
    if (key.length === 0) {
      continue
    }

    let value = params[key]
    if (Array.isArray(value)) {
      value = filterEmptyValueFromArray(value)
      if (value.length === 0) {
        continue
      }
    } else if (typeof value === 'string') {
      if (value.length === 0) {
        continue
      }
    }

    filtered[key] = value
  }

  return filtered
}

const extractParamsFromQuerystring = (str: string): FetchParams => {
  const parsed = parse(str)
  const params: FetchParams = {}
  for (const key in parsed) {
    const value = parsed[key]
    if (value !== undefined) {
      params[key] = value
    }
  }

  return params
}

const stringCompareFn = (a: string, b: string): number => a.localeCompare(b)

const standardizeReqOptions = (options: StandardizedFetchOptions): string | undefined => {
  const input: FetchOptions = { ...options }
  options.uri = input.uri ?? ''
  options.params = input.params ?? {}
  options.headers = input.headers ?? {}
  options.method = (input.method ?? (options.body !== undefined ? 'POST' : 'GET')).toUpperCase()

  let isFullUri = false
  if (options.uri.match(/^https?:\/\//) === null) {
    const uriMatches = options.uri.match(/^\/*([^?]*)(\?(.+))?$/)
    if (uriMatches !== null) {
      options.uri = uriMatches[1]
      options.params = { ...options.params, ...extractParamsFromQuerystring(uriMatches[3]) }
    }
  } else {
    isFullUri = true
  }

  options.params = filterEmptyKeyOrValueFromParams(options.params)
  const paramsStringified = stringify(options.params)
  const paramsParts = paramsStringified.split(/&/).sort(stringCompareFn)
  options.paramsAsString = paramsParts.join('&')

  let explain = `${options.method} ${options.uri}?${options.paramsAsString}`
  if (isFullUri) {
    // still parse query from options.uri to make sure options.param is correct
    const uriQueryMatches = options.uri.match(/\?(.+)$/)
    if (uriQueryMatches !== null) {
      options.params = { ...options.params, ...extractParamsFromQuerystring(uriQueryMatches[1]) }
    }

    explain = `${options.method} full=${options.uri} params=${options.paramsAsString}`
  }

  if (
    options.body !== undefined ||
    options.keepalive === true ||
    options.parseJson === false
  ) {
    // requests with these options can't be detected properly
    // unique ID will not be generated
    return
  }

  return hashMd5(explain)
}

export default standardizeReqOptions
