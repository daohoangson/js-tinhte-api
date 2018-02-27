import md5 from 'md5'
import unfetch from 'isomorphic-unfetch'

import components from './components'
import hoc from './hoc'

const apiFactory = (config = {}) => {
  if (typeof config !== 'object') {
    config = {}
  }
  const apiRoot = (typeof config.apiRoot === 'string') ? config.apiRoot : 'https://tinhte.vn/appforo/index.php'
  const callbackUrl = (typeof config.callbackUrl === 'string') ? config.callbackUrl : ''
  const clientId = (typeof config.clientId === 'string') ? config.clientId : ''
  const cookiePrefix = (typeof config.cookiePrefix === 'string') ? config.cookiePrefix : 'auth_'
  const debug = (typeof config.debug === 'boolean') ? config.debug : false
  const scope = (typeof config.scope === 'string') ? config.scope : 'read'

  let auth = null
  if (typeof config.auth === 'object') {
    const ca = config.auth
    auth = {
      access_token: (typeof ca.access_token === 'string') ? ca.access_token : '',
      user_id: (typeof ca.user_id === 'number') ? ca.user_id : 0
    }

    if (auth.access_token.length > 0 && auth.user_id === 0) {
      // detect XenForo environments
      if (typeof XenForo === 'object' && XenForo !== null &&
        typeof XenForo.visitor === 'object' &&
        typeof XenForo.visitor.user_id === 'number' &&
        typeof XenForo._csrfToken === 'string') {
        // XenForo 1.x
        auth.user_id = XenForo.visitor.user_id
        auth._xf1 = XenForo
      } else if (typeof XF === 'object' && XF !== null &&
        typeof XF.config === 'object' &&
        typeof XF.config.userId === 'number' &&
        typeof XF.config.csrf === 'string') {
        // XenForo 2.x
        auth.user_id = XF.config.userId
        auth._xf2 = XF
      }
    }
  }

  const uniqueId = ('' + Math.random()).substr(2, 6)

  let batchRequests = null
  let fetchCount = 0
  let providerMounted = false
  let requestLatestId = 0

  const buildUrl = (url) => {
    if (url.match(/^https?:\/\//)) {
      return url
    }

    let urlQuery = url.replace('?', '&')
    if (auth) {
      if (auth.access_token) {
        urlQuery += `&oauth_token=${encodeURIComponent(auth.access_token)}`
      }
      if (auth._xf1) {
        urlQuery += `&_xfToken=${encodeURIComponent(auth._xf1._csrfToken)}`
      } else if (auth._xf2) {
        urlQuery += `&_xfToken=${encodeURIComponent(auth._xf2.config.csrf)}`
      }
    }

    const finalUrl = `${apiRoot}?${urlQuery}`

    return finalUrl
  }

  const callbacks = {
    listForAuth: { name: 'auth', items: [] },
    listForProviderMount: { name: 'provider mount', items: [] },
    sharedQueue: [],

    add: (list, callback, triggerNow) => {
      if (typeof callback !== 'function') {
        return () => false
      }

      if (triggerNow) {
        callback()
        internalApi.log('Triggered %s callback without adding', list.name)
        return () => false
      }

      const { items } = list
      items.push(callback)
      internalApi.log('Added new %s callback, total=%d', list.name, items.length)

      const cancel = () => {
        const i = items.indexOf(callback)
        if (i < 0) {
          return false
        }

        items.splice(i, 1)
        internalApi.log('Removed %s callback #%d, remaining=%d', list.name, i, items.length)
        return true
      }

      return cancel
    },

    enqueueToFetch: (list) => {
      const { items } = list
      const callbackCount = items.length

      if (callbackCount > 0) {
        const { sharedQueue } = callbacks
        items.forEach((callback) => sharedQueue.push(callback))

        const sharedQueueLength = sharedQueue.length
        setTimeout(() => {
          if (sharedQueue.length !== sharedQueueLength) {
            // another invocation has altered the shared queue,
            // stop running now and let that handle the fetch
            return
          }

          const fetches = () => {
            sharedQueue.forEach((callback) => callback())
            internalApi.log('Triggered %d callbacks', sharedQueueLength)

            sharedQueue.length = 0
          }

          api.fetchMultiple(fetches, {cacheJson: true})
            .catch(reason => internalApi.log(reason))
        }, 0)

        items.length = 0
      }

      internalApi.log('Queued %d %s callbacks', callbackCount, list.name)

      return callbackCount
    }
  }

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

  const fetchMultipleInMemoryCache = {
    items: [],

    get: (body) => {
      let found = null

      fetchMultipleInMemoryCache.items.forEach((cache) => {
        if (cache.body !== body) {
          return
        }

        found = JSON.parse(cache.json)
      })

      if (found !== null) {
        found._fromCache = true
        internalApi.log('Found cached json for %s', body)
      }

      return found
    },

    reset: () => (fetchMultipleInMemoryCache.items.length = 0),

    set: (body, json) => fetchMultipleInMemoryCache.items.push({body, json: JSON.stringify(json)})
  }

  const internalApi = {
    buildAuthorizeUrl: () => {
      if (!clientId) {
        return null
      }

      const authorizeUrl = `${apiRoot}?oauth/authorize&` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        'response_type=token&' +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${encodeURIComponent(uniqueId)}`

      return authorizeUrl
    },

    log: function () {
      if (!debug) {
        return
      }

      const args = arguments
      args[0] = `[api#${uniqueId}] ${args[0]}`

      console.log.apply(this, args)
    },

    setAuth: (newAuth) => {
      auth = {}

      const notify = () => {
        const { enqueueToFetch, listForAuth } = callbacks
        return enqueueToFetch(listForAuth)
      }

      if (typeof newAuth !== 'object' ||
        typeof newAuth.access_token !== 'string' ||
        typeof newAuth.state !== 'string') {
        return notify()
      }

      if (newAuth.state !== uniqueId) {
        return notify()
      }

      auth = newAuth
      return notify()
    },

    setProviderMounted: () => {
      if (providerMounted) {
        return 0
      }

      providerMounted = true

      const { enqueueToFetch, listForProviderMount } = callbacks
      return enqueueToFetch(listForProviderMount)
    }
  }

  const api = {

    CallbackComponent: () => components.Callback(api, internalApi),

    ConsumerHoc: hoc.ApiConsumer,

    LoaderComponent: () => components.Loader(api, internalApi),

    ProviderHoc: (Component) => hoc.ApiProvider(Component, api, internalApi),

    getAccessToken: () => (auth && auth.access_token) ? auth.access_token : '',

    getApiRoot: () => apiRoot,

    getCallbackUrl: () => callbackUrl,

    getClientId: () => clientId,

    getCookieName: () => {
      if (!cookiePrefix || !clientId) {
        return ''
      }

      const safeClientId = clientId.replace(/[^a-z0-9]/gi, '')
      if (!safeClientId) {
        return ''
      }

      return cookiePrefix + safeClientId
    },

    getDebug: () => debug,

    getScope: () => scope,

    getFetchCount: () => fetchCount,

    getUniqueId: () => uniqueId,

    getUserId: () => (auth && auth.user_id) ? auth.user_id : 0,

    fetchOne: (uri, method = 'GET', headers = {}, body = null) => {
      if (!uri) {
        return Promise.reject(new Error('uri is required'))
      }

      requestLatestId++

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
            id: '_req' + requestLatestId,
            resolve,
            reject,
            uniqueId: md5(method + uri)
          })
        })
      }
    },

    fetchMultiple: (fetches, options = {}) => {
      if (typeof options !== 'object') {
        options = {}
      }
      const cacheJson = typeof options.cacheJson === 'boolean' ? options.cacheJson : false
      const triggerHandlers = typeof options.triggerHandlers === 'boolean' ? options.triggerHandlers : true

      // initialize batchRequests to indicate that we are having a pending batch
      batchRequests = []
      fetches()

      const headers = {}
      const handlers = {}
      const batchBody = []
      const reqIds = {}
      batchRequests.forEach((req) => {
        Object.keys(req.options.headers).forEach((headerKey) => {
          headers[headerKey] = req.options.headers[headerKey]
        })

        const { id, uniqueId } = req
        const uri = req.options.uri
        const method = req.options.method.toUpperCase()

        handlers[id] = {
          method,
          resolve: req.resolve,
          reject: req.reject,
          uri
        }

        if (typeof reqIds[uniqueId] === 'undefined') {
          reqIds[uniqueId] = [id]
          batchBody.push({ id: uniqueId, uri, method })
        } else {
          reqIds[uniqueId].push(id)
        }
      })

      // reset batchRequests to handle future requests normally
      batchRequests = null

      if (batchBody.length === 0) {
        return Promise.reject(new Error('There is no fetches'))
      }

      const body = JSON.stringify(batchBody)

      const processJobs = (json) => {
        const jobs = typeof json.jobs === 'object' ? json.jobs : {}
        json._handled = 0

        const handle = (jobId, reqId) => {
          if (!triggerHandlers) {
            return
          }

          const handler = handlers[reqId]

          const resolve = (job) => {
            json._handled++
            internalApi.log('Resolving %s %s...', handler.method, handler.uri)

            return handler.resolve(job)
          }

          const reject = (reason) => {
            json._handled++
            internalApi.log('Rejecting %s %s (%s)...', handler.method, handler.uri, reason)

            return handler.reject(reason)
          }

          if (typeof jobs[jobId] === 'object') {
            const job = jobs[jobId]
            if (typeof job._job_result === 'string') {
              if (job._job_result === 'ok') {
                return resolve(job)
              } else if (job._job_error) {
                return reject(job._job_error)
              }
            }
          }

          return reject(new Error('Could not find job ' + jobId))
        }

        Object.keys(reqIds).forEach((uniqueId) => {
          reqIds[uniqueId].forEach((reqId) => handle(uniqueId, reqId))
        })

        return json
      }

      if (!cacheJson) {
        fetchMultipleInMemoryCache.reset()
      } else {
        const json = fetchMultipleInMemoryCache.get(body)
        if (json !== null) {
          return new Promise((resolve) => resolve(processJobs(json)))
        }
      }

      return fetchJson('/batch', {method: 'POST', headers, body})
        .then(json => {
          if (cacheJson) {
            fetchMultipleInMemoryCache.set(body, json)
          }

          return processJobs(json)
        })
    },

    onAuthenticated: (callback) => {
      const { add, listForAuth } = callbacks
      return add(listForAuth, callback, auth !== null)
    },

    onProviderMounted: (callback) => {
      const { add, listForProviderMount } = callbacks
      return add(listForProviderMount, callback, providerMounted)
    },

    setAuth: (newAuth) => {
      if (!debug) {
        throw new Error('Access denied')
      }

      return internalApi.setAuth(newAuth)
    }
  }

  internalApi.log('Initialized')

  return api
}

export default apiFactory
