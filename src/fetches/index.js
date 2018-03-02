import querystring from 'querystring'
import unfetch from 'isomorphic-unfetch'

import fetchOneInit from './fetchOne'
import fetchMultipleInit from './fetchMultiple'

const fetchesInit = (api, internalApi) => {
  let batchLatestId = 0

  const batch = {
    id: 0,
    reqs: [],

    forEach: (f) => batch.reqs.forEach(f),
    getId: () => batch.id,
    init: () => {
      batchLatestId++
      batch.id = batchLatestId
      batch.reqs.length = 0
    },
    isOpen: () => batch.id > 0,
    push: (req) => batch.reqs.push(req),
    reset: () => (batch.id = 0)
  }

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

    return unfetch(finalUrl, options)
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
