import React from 'react'
import randomBytes from 'randombytes'
import unfetch from 'unfetch'

import Callback from './components/Callback'
import Loader from './components/Loader'

require('es6-promise').polyfill()

export default (apiClientId, apiRoot = 'https://tinhte.vn/appforo/index.php') => {
  let auth = null
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

  const api = {
    CallbackComponent: (props) => {
      return <Callback {...props} />
    },

    LoaderComponent: (props) => {
      let secret = null

      const buildAuthorizeUrl = (redirectUri) => {
        if (secret === null) {
          secret = randomBytes(32).toString('hex')
        }

        return `${apiRoot}?oauth/authorize&` +
          `client_id=${apiClientId}&` +
          `redirect_uri=` + encodeURIComponent(redirectUri) + `&` +
          `response_type=token&` +
          `state=${secret}`
      }

      const setAuth = (newAuth) => {
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

      return <Loader {...props}
        api={api}
        buildAuthorizeUrl={buildAuthorizeUrl}
        setAuth={setAuth} />
    },

    getUserId: () => (auth && auth.user_id) ? auth.user_id : 0,

    fetchOne: (uri, method = 'GET', headers = {}, body = null) => {
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
