import React from 'react'
import randomBytes from 'randombytes'
import unfetch from 'isomorphic-unfetch'

import Callback from './components/Callback'
import hoc from './hoc'

require('es6-promise').polyfill()

export default (config = {}) => {
  if (typeof config !== 'object') {
    config = {clientId: config}
  }
  const apiRoot = (typeof config.apiRoot === 'string') ? config.apiRoot : 'https://tinhte.vn/appforo/index.php'
  const callbackUrl = (typeof config.callbackUrl === 'string') ? config.callbackUrl : ''
  const clientId = (typeof config.clientId === 'string') ? config.clientId : ''
  const scope = (typeof config.scope === 'string') ? config.scope : 'read'

  let auth = null
  if (typeof config.auth === 'object') {
    const ca = config.auth
    auth = {
      access_token: (typeof ca.access_token === 'string') ? ca.access_token : '',
      user_id: (typeof ca.user_id === 'number') ? ca.user_id : 0
    }
  }

  let secret = null

  let requestCounter = 0
  let batchRequests = null

  const fetchJson = (url, options) => {
    let urlQuery = url.replace('?', '&')
    if (auth && auth.access_token) {
      urlQuery += `&oauth_token=${auth.access_token}`
    }

    const finalUrl = `${apiRoot}?${urlQuery}`

    return unfetch(finalUrl, options)
      .then(response => response.json())
      .then((json) => {
        if (json.error) {
          throw new Error(json.error)
        }

        if (json.errors) {
          throw new Error(json.errors)
        }

        return json
      })
  }

  const internalApi = {
    buildAuthorizeUrl: (redirectUri) => {
      if (!clientId) {
        return null
      }

      if (secret === null) {
        secret = randomBytes(32).toString('hex')
      }

      const authorizeUrl = `${apiRoot}?oauth/authorize&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        'response_type=token&' +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${secret}`

      return authorizeUrl
    },

    getCallbackUrl: () => callbackUrl,

    setAuth: (newAuth) => {
      auth = {}
      if (!newAuth || !newAuth.access_token || !newAuth.state) {
        return false
      }

      if (newAuth.state !== secret) {
        return false
      }

      auth = newAuth
      return true
    }
  }

  const api = {
    CallbackComponent: (props) => {
      return <Callback {...props} />
    },

    getUserId: () => (auth && auth.user_id) ? auth.user_id : 0,

    hocApiConsumer: hoc.ApiConsumer,

    hocApiProvider: (Component) => hoc.ApiProvider(api, internalApi, Component),

    fetchOne: (uri, method = 'GET', headers = {}, body = null) => {
      if (!uri) {
        return new Promise((resolve, reject) => reject(new Error('uri is required')))
      }

      requestCounter++

      const options = {
        uri,
        method,
        headers,
        body
      }

      if (batchRequests === null || body !== null) {
        return fetchJson(uri, options)
      } else {
        // a batch is pending, join it
        return new Promise((resolve, reject) => {
          batchRequests.push({
            options,
            id: '_req' + requestCounter,
            resolve,
            reject
          })
        })
      }
    },

    fetchMultiple: (fetches) => {
      // initialize batchRequests as we are having a pending batch
      batchRequests = []

      fetches()

      const headers = {}
      const handlers = {}
      const batchBody = batchRequests.map((req) => {
        for (var headerKey of Object.keys(req.options.headers)) {
          headers[headerKey] = req.options.headers[headerKey]
        }

        handlers[req.id] = {
          resolve: req.resolve,
          reject: req.reject,
          handled: false
        }

        return {
          id: req.id,
          uri: req.options.uri,
          method: req.options.method
        }
      })

      // reset batchRequests to handle future requests normally
      batchRequests = null

      fetchJson('/batch', {
        method: 'POST',
        body: JSON.stringify(batchBody)
      }).then(responses => {
        Object.keys(responses.jobs).map(jobId => {
          if (!handlers[jobId]) {
            return
          }

          const json = responses.jobs[jobId]
          if (!json._job_result) {
            return
          }

          if (json._job_result === 'ok') {
            handlers[jobId].resolve(json)
          } else {
            handlers[jobId].reject(json._job_error)
          }

          handlers[jobId].handled = true
        })

        Object.keys(handlers).map(handleId => {
          const handler = handlers[handleId]
          if (handler.handled) {
            return
          }

          handler.reject()
        })
      })
    }
  }

  return api
}
