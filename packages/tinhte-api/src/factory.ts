import fetchesInit from './fetches'
import { FetchHeaders, FetchOptions } from './fetches/types'
import { hashMd5 } from './helpers/crypt'
import { grantTypePassword, grantTypeRefreshToken } from './helpers/oauth'
import { Api, ApiAuth, ApiConfig, ApiInternal } from './types'

const apiFactory = (config: ApiConfig = {}): Api => {
  let apiRoot = 'https://tinhte.vn/appforo/index.php'
  let auth: ApiAuth | undefined
  let callbackUrl = ''
  let clientId = ''
  let cookiePrefix = ''
  let debug = false
  let ott = ''
  let scope = 'read'
  let headers: FetchHeaders = {}

  const updateConfig = (config: ApiConfig = {}): void => {
    if (typeof config.apiRoot === 'string') apiRoot = config.apiRoot
    if (typeof config.auth === 'object') {
      auth = {
        accessToken: '',
        userId: 0
      }

      const ca = config.auth
      if (typeof ca.accessToken === 'string') auth.accessToken = ca.accessToken
      if (typeof ca.userId === 'number') auth.userId = ca.userId

      if ((auth.accessToken?.length ?? 0) > 0 && auth.userId === 0) {
        const browser = window as any
        // detect XenForo environments
        if (typeof browser.XenForo === 'object' &&
          browser.XenForo !== null &&
          typeof browser.XenForo.visitor === 'object' &&
          typeof browser.XenForo.visitor.user_id === 'number' &&
          typeof browser.XenForo._csrfToken === 'string') {
          // XenForo 1.x
          auth.userId = browser.XenForo.visitor.user_id
          auth._xf1 = browser.XenForo
        } else if (typeof browser.XF === 'object' &&
          browser.XF !== null &&
          typeof browser.XF.config === 'object' &&
          typeof browser.XF.config.userId === 'number' &&
          typeof browser.XF.config.csrf === 'string') {
          // XenForo 2.x
          auth.userId = browser.XF.config.userId
          auth._xf2 = browser.XF
        }
      }
    }
    if (typeof config.callbackUrl === 'string') callbackUrl = config.callbackUrl
    if (typeof config.clientId === 'string') clientId = config.clientId
    if (typeof config.cookiePrefix === 'string') cookiePrefix = config.cookiePrefix
    if (typeof config.debug === 'boolean') debug = config.debug
    if (typeof config.ott === 'string') ott = config.ott
    if (typeof config.scope === 'string') scope = config.scope

    if (typeof config.headers === 'object') {
      headers = { ...config.headers }
    }
  }
  updateConfig(config)

  const uniqueId = `${Math.random()}`.substr(2, 6)

  const internalApi: ApiInternal = {

    log: (...args) => {
      if (!debug) {
        return false
      }

      const args0 = args[0]
      if (typeof args0 === 'string') {
        args[0] = `[tinhte-api#${uniqueId}] ${args0}`
      }

      console.log.apply(console, args)
      return true
    }
  }

  const api: Api = {

    fetchMultiple: async (f, options) => await fetches.fetchMultiple(f, options),
    batch: async (f, options) => await fetches.fetchMultiple(f, options),

    fetchOne: async (input) => await fetches.fetchOne(input),
    del: async (input) => await fetchShortcut('DELETE', input),
    get: async (input) => await fetchShortcut('GET', input),
    post: async (input) => await fetchShortcut('POST', input),
    put: async (input) => await fetchShortcut('PUT', input),

    login: async (clientSecret, username, password) =>
      await grantTypePassword(api, internalApi, clientSecret, username, password),

    refreshToken: async (clientSecret, refreshToken) =>
      await grantTypeRefreshToken(api, internalApi, clientSecret, refreshToken),

    clone: (config) => {
      const clonedConfig: ApiConfig = {
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

    getAccessToken: () => auth?.accessToken ?? '',

    getApiRoot: () => apiRoot,

    getAuth: () => ({ ...(auth ?? {}) }),

    getCallbackUrl: () => callbackUrl,

    getClientId: () => clientId,

    getCookiePrefix: () => cookiePrefix,

    getDebug: () => debug,

    getFetchCount: () => fetches.getFetchCount(),

    getOtt: () => ott,

    getScope: () => scope,

    getHeaders: () => ({ ...headers }),

    getUniqueId: () => uniqueId,

    getUserId: () => auth?.userId ?? 0,

    hasAuth: () => auth !== undefined,

    updateConfig
  }

  const fetches = fetchesInit(api, internalApi)
  const fetchShortcut = async (method: string, input: string | FetchOptions): Promise<any> => {
    if (typeof input === 'string') {
      input = { uri: input }
    }
    input.method = method
    return await fetches.fetchOne(input)
  }

  return api
}

export default apiFactory
