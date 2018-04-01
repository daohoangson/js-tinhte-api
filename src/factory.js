import { isDate } from 'lodash'
import md5 from 'md5'

import components from './components'
import fetchesInit from './fetches'
import { isPlainObject, mustBePlainObject } from './helpers'
import helperCallbacksInit from './helpers/callbacks'
import errors from './helpers/errors'
import fetchApiDataForProvider from './helpers/fetchApiDataForProvider'
import hoc from './hoc'

const apiFactory = (config = {}) => {
  let apiRoot = 'https://tinhte.vn/appforo/index.php'
  let auth = null
  let callbackUrl = ''
  let clientId = ''
  let cookiePrefix = 'auth_'
  let debug = false
  let ott = ''
  let scope = 'read'

  const updateConfig = (config) => {
    config = mustBePlainObject(config)

    if (typeof config.apiRoot === 'string') apiRoot = config.apiRoot
    if (isPlainObject(config.auth)) {
      auth = {
        accessToken: '',
        userId: 0
      }

      const ca = config.auth
      if (typeof ca.accessToken === 'string') auth.accessToken = ca.accessToken
      if (typeof ca.userId === 'number') auth.userId = ca.userId

      if (auth.accessToken.length > 0 && auth.userId === 0) {
        // detect XenForo environments
        if (typeof XenForo !== 'undefined' &&
          isPlainObject(XenForo) &&
          isPlainObject(XenForo.visitor) &&
          typeof XenForo.visitor.user_id === 'number' &&
          typeof XenForo._csrfToken === 'string') {
          // XenForo 1.x
          auth.userId = XenForo.visitor.user_id
          auth._xf1 = XenForo
        } else if (typeof XF !== 'undefined' &&
          isPlainObject(XF) &&
          isPlainObject(XF.config) &&
          typeof XF.config.userId === 'number' &&
          typeof XF.config.csrf === 'string') {
          // XenForo 2.x
          auth.userId = XF.config.userId
          auth._xf2 = XF
        }
      }
    }
    if (typeof config.callbackUrl === 'string') callbackUrl = config.callbackUrl
    if (typeof config.clientId === 'string') clientId = config.clientId
    if (typeof config.cookiePrefix === 'string') cookiePrefix = config.cookiePrefix
    if (typeof config.debug === 'boolean') debug = config.debug
    if (typeof config.ott === 'string') ott = config.ott
    if (typeof config.scope === 'string') scope = config.scope
  }
  updateConfig(config)

  const uniqueId = ('' + Math.random()).substr(2, 6)
  const callbackListForAuth = { name: 'auth', items: [] }
  const callbackListForProviderMount = { name: 'provider mount', items: [] }

  let providerMounted = false

  const internalApi = {
    LoaderComponent: () => components.Loader(api, internalApi),

    getAuth: () => auth,

    log: function (message) {
      if (!debug) {
        return message
      }

      const args = arguments
      args[0] = `[api#${uniqueId}] ${args[0]}`

      console.log.apply(this, args)
      return message
    },

    setAuth: (newAuth) => {
      auth = {}

      const notify = () => callbacks.fetchList(callbackListForAuth)

      if (!isPlainObject(newAuth) ||
        typeof newAuth.state !== 'string' ||
        newAuth.state !== uniqueId) {
        return notify()
      }

      if (typeof newAuth.access_token === 'string') {
        auth.accessToken = newAuth.access_token
      }

      let userId = 0
      if (typeof newAuth.user_id === 'number') {
        userId = newAuth.user_id
      } else if (typeof newAuth.user_id === 'string') {
        userId = parseInt(newAuth.user_id)
      }
      if (userId > 0) {
        auth.userId = userId
      }

      return notify()
    },

    setProviderMounted: () => {
      if (providerMounted) {
        return 0
      }

      providerMounted = true

      return callbacks.fetchList(callbackListForProviderMount)
    },

    updateConfig
  }

  const api = {

    CallbackComponent: () => components.Callback(api, internalApi),

    ConsumerHoc: hoc.ApiConsumer,

    ProviderHoc: (Component) => hoc.ApiProvider(Component, api, internalApi),

    clone: (config) => {
      config = mustBePlainObject(config)

      const clonedConfig = {
        apiRoot,
        auth,
        callbackUrl,
        clientId,
        cookiePrefix,
        debug,
        ott,
        scope,

        ...config
      }

      return apiFactory(clonedConfig)
    },

    fetchApiDataForProvider: (rootElement) => fetchApiDataForProvider(api, internalApi, rootElement),

    generateOneTimeToken: (clientSecret, ttl) => {
      /* istanbul ignore else  */
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
      if (isDate(ttl)) {
        // ttl is a Date, use its value directly
        timestamp = Math.floor(ttl.getTime() / 1000)
      } else {
        timestamp = Math.floor(new Date().getTime() / 1000) + (typeof ttl === 'number' ? ttl : 3600)
      }

      const once = md5(`${userId}${timestamp}${clientSecret}`)
      const ott = `${userId},${timestamp},${once},${clientId}`

      return ott
    },

    getAccessToken: () => (auth && auth.accessToken) ? auth.accessToken : '',

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

    getUserId: () => (auth && auth.userId) ? auth.userId : 0,

    onAuthenticated: (callback) => {
      return callbacks.add(callbackListForAuth, callback, auth !== null)
    },

    onProviderMounted: (callback) => {
      return callbacks.add(callbackListForProviderMount, callback, providerMounted)
    },

    setAuth: (newAuth) => {
      if (!debug) {
        throw new Error(errors.SET_AUTH_ACCESS_DENIED)
      }

      return internalApi.setAuth(newAuth)
    }
  }

  const fetches = fetchesInit(api, internalApi)
  api.fetchOne = fetches.fetchOne
  api.fetchMultiple = fetches.fetchMultiple
  api.getFetchCount = fetches.getFetchCount

  const fetchShortcut = (method, options) => {
    if (typeof options === 'string') {
      options = {uri: options}
    }
    options = mustBePlainObject(options)
    options.method = method
    return api.fetchOne(options)
  }
  api.del = (options) => fetchShortcut('DELETE', options)
  api.get = (options) => fetchShortcut('GET', options)
  api.post = (options) => fetchShortcut('POST', options)
  api.put = (options) => fetchShortcut('PUT', options)

  api.batch = api.fetchMultiple

  const callbacks = helperCallbacksInit(api, internalApi)

  return api
}

export default apiFactory
