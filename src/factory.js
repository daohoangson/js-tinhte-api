import md5 from 'md5'
import reactTreeWalker from 'react-tree-walker'

import components from './components'
import fetchesInit from './fetches'
import helperCallbacksInit from './helpers/callbacks'
import hoc from './hoc'

const apiFactory = (config = {}) => {
  if (typeof config !== 'object') {
    config = {}
  }
  let apiRoot = (typeof config.apiRoot === 'string') ? config.apiRoot : 'https://tinhte.vn/appforo/index.php'
  let callbackUrl = (typeof config.callbackUrl === 'string') ? config.callbackUrl : ''
  let clientId = (typeof config.clientId === 'string') ? config.clientId : ''
  let cookiePrefix = (typeof config.cookiePrefix === 'string') ? config.cookiePrefix : 'auth_'
  let debug = (typeof config.debug === 'boolean') ? config.debug : false
  let ott = (typeof config.ott === 'string') ? config.ott : ''
  let scope = (typeof config.scope === 'string') ? config.scope : 'read'

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
  const callbackListForAuth = { name: 'auth', items: [] }
  const callbackListForProviderMount = { name: 'provider mount', items: [] }

  let providerMounted = false

  const internalApi = {
    LoaderComponent: () => components.Loader(api, internalApi),

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

    standardizeReqOptions: (options) => {
      let { uri, method, headers, body } = options
      if (typeof uri !== 'string') options.uri = ''
      if (typeof method !== 'string') options.method = 'GET'
      if (typeof headers !== 'object') options.headers = {}
      if (typeof body !== 'object') options.body = null
      const uniqueId = md5(options.method + options.uri)

      return uniqueId
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

    onAuthenticated: (callback) => {
      return callbacks.add(callbackListForAuth, callback, auth !== null)
    },

    onProviderMounted: (callback) => {
      return callbacks.add(callbackListForProviderMount, callback, providerMounted)
    },

    setAuth: (newAuth) => {
      auth = {}

      const notify = () => callbacks.fetchList(callbackListForAuth)

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

      return callbacks.fetchList(callbackListForProviderMount)
    },

    updateConfig: (config) => {
      if (typeof config !== 'object') {
        config = {}
      }

      if (typeof config.apiRoot === 'string') apiRoot = config.apiRoot
      if (typeof config.auth === 'object') {
        const ca = config.auth
        if (auth === null) auth = {}
        if (typeof ca.access_token === 'string') auth.access_token = ca.access_token
        if (typeof ca.user_id === 'number') auth.user_id = ca.user_id
      }
      if (typeof config.callbackUrl === 'string') callbackUrl = config.callbackUrl
      if (typeof config.clientId === 'string') clientId = config.clientId
      if (typeof config.cookiePrefix === 'string') cookiePrefix = config.cookiePrefix
      if (typeof config.debug === 'boolean') debug = config.debug
      if (typeof config.ott === 'string') ott = config.ott
      if (typeof config.scope === 'string') scope = config.scope

      internalApi.log('Updated config')
    }
  }

  const api = {

    CallbackComponent: () => components.Callback(api, internalApi),

    ConsumerHoc: hoc.ApiConsumer,

    ProviderHoc: (Component) => hoc.ApiProvider(Component, api, internalApi),

    fetchApiDataForProvider: (rootElement) => {
      return reactTreeWalker(rootElement, () => true)
        .then(() => {
          const { items } = callbackListForProviderMount
          const options = {triggerHandlers: false}
          return callbacks.fetchItems(items, options)
        })
        .then(
          (json) => json.jobs,
          (reason) => {
            internalApi.log(reason)
            return {}
          }
        )
    },

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
      ott = `${userId},${timestamp},${once},${clientId}`

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

    setAuth: (newAuth) => {
      if (!debug) {
        throw new Error('Access denied')
      }

      return internalApi.setAuth(newAuth)
    }
  }

  const fetches = fetchesInit(api, internalApi)
  api.fetchOne = fetches.fetchOne
  api.fetchMultiple = fetches.fetchMultiple
  api.getFetchCount = fetches.getFetchCount

  const callbacks = helperCallbacksInit(api, internalApi)

  return api
}

export default apiFactory
