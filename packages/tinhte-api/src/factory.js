import fetchesInit from './fetches'
import { hashMd5 } from './helpers/crypt'
import oauthTokenGrantTypePassword from './helpers/oauth/token/grantTypePassword'
import oauthTokenGrantTypeRefreshToken from './helpers/oauth/token/grantTypeRefreshToken'

const apiFactory = (config = {}) => {
  let apiRoot = 'https://tinhte.vn/appforo/index.php'
  let auth = null
  let callbackUrl = ''
  let clientId = ''
  let cookiePrefix = 'auth_'
  let debug = false
  let ott = ''
  let scope = 'read'

  const updateConfig = (config = {}) => {
    if (typeof config.apiRoot === 'string') apiRoot = config.apiRoot
    if (typeof config.auth === 'object' && config.auth !== null) {
      auth = {
        accessToken: '',
        userId: 0
      }

      const ca = config.auth
      if (typeof ca.accessToken === 'string') auth.accessToken = ca.accessToken
      if (typeof ca.userId === 'number') auth.userId = ca.userId

      if (auth.accessToken.length > 0 && auth.userId === 0) {
        // detect XenForo environments
        if (typeof XenForo === 'object' &&
          XenForo !== null &&
          typeof XenForo.visitor === 'object' &&
          typeof XenForo.visitor.user_id === 'number' &&
          typeof XenForo._csrfToken === 'string') {
          // XenForo 1.x
          auth.userId = XenForo.visitor.user_id
          auth._xf1 = XenForo
        } else if (typeof XF === 'object' &&
          XF !== null &&
          typeof XF.config === 'object' &&
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

  const internalApi = {

    log: function (message) {
      if (!debug) {
        return false
      }

      const args = arguments
      args[0] = `[tinhte-api#${uniqueId}] ${args[0]}`

      console.log.apply(this, args)
      return true
    }

  }

  const api = {

    clone: (config = {}) => {
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

    generateOneTimeToken: (clientSecret, ttl) => {
      const userId = api.getUserId()

      let timestamp
      if (typeof ttl === 'object' && typeof ttl.getTime === 'function') {
        // ttl is a Date, use its value directly
        timestamp = Math.floor(ttl.getTime() / 1000)
      } else {
        timestamp = Math.floor(new Date().getTime() / 1000) + (typeof ttl === 'number' ? ttl : 3600)
      }

      const once = hashMd5(`${userId}${timestamp}${clientSecret}`)
      const ott = `${userId},${timestamp},${once},${clientId}`

      return ott
    },

    getAccessToken: () => (auth && auth.accessToken) ? auth.accessToken : '',

    getApiRoot: () => apiRoot,

    getAuth: () => ({ ...(auth || {}) }),

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

    hasAuth: () => auth != null,

    updateConfig
  }

  const fetches = fetchesInit(api, internalApi)
  api.fetchOne = fetches.fetchOne
  api.fetchMultiple = fetches.fetchMultiple
  api.getFetchCount = fetches.getFetchCount

  const fetchShortcut = (method, options) => {
    if (typeof options === 'string') {
      options = { uri: options }
    }
    options.method = method
    return api.fetchOne(options)
  }
  api.del = (options) => fetchShortcut('DELETE', options)
  api.get = (options) => fetchShortcut('GET', options)
  api.post = (options) => fetchShortcut('POST', options)
  api.put = (options) => fetchShortcut('PUT', options)

  api.batch = api.fetchMultiple

  api.login = (clientSecret, username, password) =>
    oauthTokenGrantTypePassword(api, internalApi, clientSecret, username, password)

  api.refreshToken = (clientSecret, refreshToken) =>
    oauthTokenGrantTypeRefreshToken(api, internalApi, clientSecret, refreshToken)

  return api
}

export default apiFactory
