import unfetch from 'isomorphic-unfetch'

import batchFactory from './batch'
import fetchOneInit from './fetchOne'
import fetchMultipleInit from './fetchMultiple'
import { mustBePlainObject } from '../helpers'

const fetchesInit = (api, internalApi) => {
  const batch = batchFactory()

  const buildUrlQueryParts = (options) => {
    const { params, paramsAsString } = options

    const urlQueryParts = []
    if (typeof paramsAsString === 'string' && paramsAsString.length > 0) {
      urlQueryParts.push(paramsAsString)
    }

    const auth = internalApi.getAuth()
    if (auth) {
      if (!params.oauth_token && auth.accessToken) {
        params.oauth_token = auth.accessToken
        urlQueryParts.push(`oauth_token=${encodeURIComponent(params.oauth_token)}`)
      }
      if (!params._xfToken) {
        if (auth._xf1) {
          params._xfToken = auth._xf1._csrfToken
          urlQueryParts.push(`_xfToken=${encodeURIComponent(params._xfToken)}`)
        } else if (auth._xf2) {
          params._xfToken = auth._xf2.config.csrf
          urlQueryParts.push(`_xfToken=${encodeURIComponent(params._xfToken)}`)
        }
      }
    }

    if (!params.oauth_token) {
      const ott = api.getOtt()
      if (ott) {
        params.oauth_token = ott
        urlQueryParts.push(`oauth_token=${encodeURIComponent(params.oauth_token)}`)
      }
    }

    return urlQueryParts
  }

  const buildUrl = (options) => {
    let url = options.uri
    url = url.match(/^https?:\/\//) ? url : `${api.getApiRoot()}?${url}`

    const urlQueryParts = buildUrlQueryParts(options)
    if (urlQueryParts.length > 0) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + urlQueryParts.join('&')
    }

    return url
  }

  let fetchCount = 0

  const fetchJson = (options) => {
    fetchCount++

    const url = buildUrl(options)

    const { body, headers, method, params } = options
    const unfetchOptions = {
      headers: { ...mustBePlainObject(headers) },
      method
    }
    if (body) unfetchOptions.body = options.body
    if (params._xfToken) unfetchOptions.credentials = 'include'

    return unfetch(url, unfetchOptions)
      .then(response => {
        return response.json()
          .catch((reason) => response.text()
            .then((text) => internalApi.log('Error parsing JSON', url, text, reason))
            .then(() => { throw reason })
          )
      })
      .then((json) => {
        if (json.errors) {
          throw new Error(json.errors)
        }

        internalApi.log('Fetched and parsed %s successfully, total=%d', url, fetchCount)

        return json
      })
  }

  const fetchOne = fetchOneInit(fetchJson, batch, internalApi)

  const fetchMultiple = fetchMultipleInit(fetchJson, batch, internalApi)

  return {
    fetchOne,
    fetchMultiple,
    getFetchCount: () => fetchCount
  }
}

export default fetchesInit
