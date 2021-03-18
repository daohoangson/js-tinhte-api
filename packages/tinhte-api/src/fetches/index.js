import batchFactory from './batch'
import fetchOneInit from './fetchOne'
import fetchMultipleInit from './fetchMultiple'

const fetchesInit = (api, internalApi) => {
  const batch = batchFactory()

  const buildUrlQueryParts = (options) => {
    const { params, paramsAsString } = options

    const urlQueryParts = []
    if (typeof paramsAsString === 'string' && paramsAsString.length > 0) {
      urlQueryParts.push(paramsAsString)
    }

    const auth = api.getAuth()
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

    const { body, method, params, parseJson } = options

    const headers = api.getHeaders()
    if (options.headers && typeof options.headers === 'object') {
      Object.keys(options.headers).forEach((key) => {
        if (options.headers[key] === undefined) {
          delete headers[key]
        } else {
          headers[key] = options.headers[key]
        }
      })
    }

    let p = fetch(url, {
      body,
      credentials: params._xfToken ? 'include' : undefined,
      headers,
      method
    })

    if (parseJson !== false) {
      p = p.then(response => {
        return response.json()
          .catch((reason) => {
            internalApi.log('Fetch %s and could not parse json: %s', url, reason.message)
            throw reason
          })
      })
        .then((json) => {
          const { errors, error_description: desc } = json
          if (errors) {
            if (Array.isArray(errors) && errors.length > 0) {
              const errorArray = new Error(errors.join(', '))
              internalApi.log('Fetched %s and found errors: %s', url, errorArray.message)
              throw errorArray
            }

            if (typeof errors === 'object') {
              const errorMessages = []
              Object.keys(errors).forEach((key) => errorMessages.push(`${key}: ${errors[key]}`))
              if (errorMessages.length > 0) {
                const errorObject = new Error(errorMessages.join('\n'))
                throw errorObject
              }
            }
          }

          if (desc) {
            internalApi.log('Fetched %s and found error_description: %s', url, desc)
            throw new Error(desc)
          }

          internalApi.log('Fetched and parsed %s successfully, total=%d', url, fetchCount)

          return json
        })
    }

    return p
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
