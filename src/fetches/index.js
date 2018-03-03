import querystring from 'querystring'
import unfetch from 'isomorphic-unfetch'

import batchFactory from './batch'
import fetchOneInit from './fetchOne'
import fetchMultipleInit from './fetchMultiple'
import { mustBePlainObject } from '../helpers'

const fetchesInit = (api, internalApi) => {
  const batch = batchFactory()

  const buildUrl = (url) => {
    if (url.match(/^https?:\/\//)) {
      return url
    }

    let urlQuery = url.replace('?', '&')
    const queryParams = querystring.parse(urlQuery)
    let hasOauthToken = !!queryParams.oauth_token
    const auth = internalApi.getAuth()

    if (auth) {
      if (!hasOauthToken && auth.accessToken) {
        urlQuery += `&oauth_token=${encodeURIComponent(auth.accessToken)}`
        hasOauthToken = true
      }
      if (auth._xf1) {
        urlQuery += `&_xfToken=${encodeURIComponent(auth._xf1._csrfToken)}`
      } else if (auth._xf2) {
        urlQuery += `&_xfToken=${encodeURIComponent(auth._xf2.config.csrf)}`
      }
    }

    if (!hasOauthToken) {
      const ott = api.getOtt()
      if (ott) {
        urlQuery += `&oauth_token=${encodeURIComponent(ott)}`
        hasOauthToken = true
      }
    }

    const finalUrl = `${api.getApiRoot()}?${urlQuery}`

    return finalUrl
  }

  let fetchCount = 0

  const fetchJson = (url, options) => {
    fetchCount++

    const finalUrl = buildUrl(url)

    options = mustBePlainObject(options)
    const unfetchOptions = {credentials: 'include', ...options}
    const headers = mustBePlainObject(options.headers)
    unfetchOptions.headers = {...headers}

    return unfetch(finalUrl, unfetchOptions)
      .then(response => response.json())
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
