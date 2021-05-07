import batchFactory from './batch'
import fetchOneInit from './fetchOne'
import fetchMultipleInit from './fetchMultiple'
import { Api, ApiInternal } from '../types'
import { Fetches, FetchJson, StandardizedFetchOptions } from './types'

const fetchesInit = (api: Api, internalApi: ApiInternal): Fetches => {
  const batch = batchFactory()

  const buildUrlQueryParts = (options: StandardizedFetchOptions): string[] => {
    const { params, paramsAsString } = options

    const urlQueryParts: string[] = []
    if (paramsAsString.length > 0) {
      urlQueryParts.push(paramsAsString)
    }

    const auth = api.getAuth()
    if (typeof params.oauth_token !== 'string' && typeof auth.accessToken === 'string') {
      params.oauth_token = auth.accessToken
      urlQueryParts.push(`oauth_token=${encodeURIComponent(params.oauth_token)}`)
    }
    if (typeof params._xfToken !== 'string') {
      if (auth._xf1 !== undefined) {
        const xf1Token = params._xfToken = auth._xf1._csrfToken
        urlQueryParts.push(`_xfToken=${encodeURIComponent(xf1Token)}`)
      } else if (auth._xf2 !== undefined) {
        const xf2Token = params._xfToken = auth._xf2.config.csrf
        urlQueryParts.push(`_xfToken=${encodeURIComponent(xf2Token)}`)
      }
    }

    if (typeof params.oauth_token !== 'string') {
      const ott = api.getOtt()
      if (ott.length > 0) {
        params.oauth_token = ott
        urlQueryParts.push(`oauth_token=${encodeURIComponent(ott)}`)
      }
    }

    return urlQueryParts
  }

  const buildUrl = (options: StandardizedFetchOptions): string => {
    let url = options.uri
    url = (url.match(/^https?:\/\//) !== null) ? url : `${api.getApiRoot()}?${url}`

    const urlQueryParts = buildUrlQueryParts(options)
    if (urlQueryParts.length > 0) {
      url += (!url.includes('?') ? '?' : '&') + urlQueryParts.join('&')
    }

    return url
  }

  let fetchCount = 0

  const fetchJson: FetchJson = async (options) => {
    fetchCount++

    const url = buildUrl(options)
    const { body, method, params, parseJson } = options

    const headers = { ...api.getHeaders() }
    const { headers: optionHeaders } = options
    for (const key in optionHeaders) {
      if (optionHeaders[key] === undefined) {
        // eslint-disable-next-line
        delete headers[key]
      } else {
        headers[key] = optionHeaders[key]
      }
    }

    let p = fetch(url, {
      body,
      credentials: (typeof params._xfToken === 'string') ? 'include' : undefined,
      headers,
      method
    })

    if (parseJson !== false) {
      p = p.then(async response => {
        return await response.json()
          .catch((reason) => {
            internalApi.log('Fetch %s and could not parse json: %s', url, reason.message)
            throw reason
          })
      })
        .then((json) => {
          const { errors, error_description: desc } = json
          if (Array.isArray(errors) && errors.length > 0) {
            const errorArray = new Error(errors.join(', '))
            internalApi.log('Fetched %s and found errors: %s', url, errorArray.message)
            throw errorArray
          }

          if (typeof errors === 'object') {
            const errorMessages: string[] = []
            for (const key in errors) {
              const error = errors[key]
              if (typeof error === 'string') {
                errorMessages.push(`${key}: ${error}`)
              }
            }
            if (errorMessages.length > 0) {
              const errorObject = new Error(errorMessages.join('\n'))
              throw errorObject
            }
          }

          if (typeof desc === 'string') {
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
