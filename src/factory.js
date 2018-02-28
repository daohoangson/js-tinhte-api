import md5 from 'md5'

import components from './components'
import fetchesInit from './fetches'
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
  let ott = (typeof config.ott === 'string') ? config.ott : ''
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

  let providerMounted = false

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

          api.fetchMultiple(fetches, {useCache: true})
            .catch(reason => internalApi.log(reason))
        }, 0)

        items.length = 0
      }

      internalApi.log('Queued %d %s callbacks', callbackCount, list.name)

      return callbackCount
    }
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

    getAuth: () => auth,

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

    generateOneTimeToken: (clientSecret, ttl) => {
      if (process.browser) {
        const message = 'Running on browser is not allowed'
        if (debug) {
          console.error(message)
        } else {
          throw new Error(message)
        }
      }

      const userId = api.getUserId()

      let timestamp
      if (typeof ttl === 'object' && typeof ttl.getTime === 'function') {
        // ttl is a Date, use its value directly
        timestamp = Math.floor(ttl.getTime() / 1000)
      } else {
        timestamp = Math.floor(new Date().getTime() / 1000) + (typeof ttl === 'number' ? ttl : 3600)
      }

      const once = md5(`${userId}${timestamp}${clientSecret}`)
      const ott = `${userId},${timestamp},${once},${clientId}`

      return ott
    },

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

    getOtt: () => ott,

    getScope: () => scope,

    getUniqueId: () => uniqueId,

    getUserId: () => (auth && auth.user_id) ? auth.user_id : 0,

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
    },

    setOneTimeToken: (newOtt) => {
      if (typeof newOtt !== 'string') {
        return false
      }

      ott = newOtt
      return true
    }
  }

  const fetches = fetchesInit(api, internalApi)
  api.fetchOne = fetches.fetchOne
  api.fetchMultiple = fetches.fetchMultiple
  api.getFetchCount = fetches.getFetchCount

  return api
}

export default apiFactory
