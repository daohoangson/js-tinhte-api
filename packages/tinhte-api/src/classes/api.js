import { isDate } from 'lodash'

import fetchesInit from 'src/fetches'
import { isPlainObject, mustBePlainObject } from 'src/helpers'
import { hashMd5 } from 'src/helpers/crypt'
import oauthTokenGrantTypePassword from 'src/helpers/oauth/token/grantTypePassword'
import oauthTokenGrantTypeRefreshToken from 'src/helpers/oauth/token/grantTypeRefreshToken'
import helperCallbacksInit from 'src/helpers/callbacks'
import errors from 'src/helpers/errors'

const assertNotBrowser = (api) => {
  /* istanbul ignore else  */
  if (process.browser) {
    if (api.getDebug()) {
      console.error(errors.ASSERT_NOT_BROWSER)
    } else {
      throw new Error(errors.ASSERT_NOT_BROWSER)
    }
  }
}

const fetchShortcut = (api, method, options) => {
  if (typeof options === 'string') {
    options = { uri: options }
  }
  options = mustBePlainObject(options)
  options.method = method
  return api.fetchOne(options)
}

export default class Api {
  constructor (config = {}) {
    this.apiRoot = 'https://tinhte.vn/appforo/index.php'
    this.auth = null
    this.callbackUrl = ''
    this.clientId = ''
    this.cookiePrefix = 'auth_'
    this.debug = false
    this.ott = ''
    this.scope = 'read'
    this.updateConfig(config)

    this.callbackListForAuth = { name: 'auth', items: [] }
    this.callbackListForProviderMount = { name: 'provider mount', items: [] }
    this.providerMounted = false
    this.uniqueId = ('' + Math.random()).substr(2, 6)

    this.callbacks = helperCallbacksInit(this)
    this.fetches = fetchesInit(this)
  }

  clone (config) {
    config = mustBePlainObject(config)

    const clonedConfig = {
      apiRoot: this.apiRoot,
      auth: this.auth,
      callbackUrl: this.callbackUrl,
      clientId: this.clientId,
      cookiePrefix: this.cookiePrefix,
      debug: this.debug,
      ott: this.ott,
      scope: this.scope,

      ...config
    }

    return new Api(clonedConfig)
  }

  fetchMultiple (fetches, options = {}) {
    return this.fetches.fetchMultiple(fetches, options)
  }

  fetchOne (options) {
    return this.fetches.fetchOne(options)
  }

  generateOneTimeToken (clientSecret, ttl) {
    assertNotBrowser(this)

    const userId = this.getUserId()

    let timestamp
    if (isDate(ttl)) {
      // ttl is a Date, use its value directly
      timestamp = Math.floor(ttl.getTime() / 1000)
    } else {
      timestamp = Math.floor(new Date().getTime() / 1000) + (typeof ttl === 'number' ? ttl : 3600)
    }

    const once = hashMd5(`${userId}${timestamp}${clientSecret}`)
    const ott = `${userId},${timestamp},${once},${this.clientId}`

    return ott
  }

  getAccessToken () {
    const auth = this.getAuth()
    return auth.accessToken ? auth.accessToken : ''
  }

  getApiRoot () {
    return this.apiRoot
  }

  getAuth () {
    return Object.assign({}, this.auth)
  }

  getCallbackUrl () {
    return this.callbackUrl
  }

  getClientId () {
    return this.clientId
  }

  getCookieName () {
    if (!this.cookiePrefix || !this.clientId) {
      return ''
    }

    const safeClientId = this.clientId.replace(/[^a-z0-9]/gi, '')
    if (!safeClientId) {
      return ''
    }

    return this.cookiePrefix + safeClientId
  }

  getDebug () {
    return this.debug
  }

  getFetchCount () {
    return this.fetches.getFetchCount()
  }

  getOtt () {
    return this.ott
  }

  getScope () {
    return this.scope
  }

  getUniqueId () {
    return this.uniqueId
  }

  getUserId () {
    const auth = this.getAuth()
    return auth.userId ? auth.userId : 0
  }

  onAuthenticated (callback) {
    return this.callbacks.add(this.callbackListForAuth, callback, this.auth !== null)
  }

  onProviderMounted (callback) {
    return this.callbacks.add(this.callbackListForProviderMount, callback, this.providerMounted)
  }

  setAuth (newAuth) {
    this.auth = {
      accessToken: '',
      userId: 0
    }

    const notify = () => this.callbacks.fetchList(this.callbackListForAuth)

    if (!isPlainObject(newAuth) ||
      typeof newAuth.state !== 'string' ||
      newAuth.state !== this.uniqueId) {
      return notify()
    }

    if (typeof newAuth.access_token === 'string') {
      this.auth.accessToken = newAuth.access_token
    }

    if (typeof newAuth.user_id === 'number') {
      this.auth.userId = newAuth.user_id
    } else if (typeof newAuth.user_id === 'string') {
      this.auth.userId = parseInt(newAuth.user_id)
    }

    return notify()
  }

  setProviderMounted () {
    if (this.providerMounted) {
      return 0
    }

    this.providerMounted = true

    return this.callbacks.fetchList(this.callbackListForProviderMount)
  }

  updateConfig (values) {
    const config = mustBePlainObject(values)

    if (typeof config.apiRoot === 'string') this.apiRoot = config.apiRoot
    if (isPlainObject(config.auth)) {
      this.auth = {
        accessToken: '',
        userId: 0
      }

      const ca = config.auth
      if (typeof ca.accessToken === 'string') this.auth.accessToken = ca.accessToken
      if (typeof ca.userId === 'number') this.auth.userId = ca.userId

      if (this.auth.accessToken.length > 0 && this.auth.userId === 0) {
        // detect XenForo environments
        if (typeof XenForo !== 'undefined' &&
          isPlainObject(XenForo) &&
          isPlainObject(XenForo.visitor) &&
          typeof XenForo.visitor.user_id === 'number' &&
          typeof XenForo._csrfToken === 'string') {
          // XenForo 1.x
          this.auth.userId = XenForo.visitor.user_id
          this.auth._xf1 = XenForo
        } else if (typeof XF !== 'undefined' &&
          isPlainObject(XF) &&
          isPlainObject(XF.config) &&
          typeof XF.config.userId === 'number' &&
          typeof XF.config.csrf === 'string') {
          // XenForo 2.x
          this.auth.userId = XF.config.userId
          this.auth._xf2 = XF
        }
      }
    }
    if (typeof config.callbackUrl === 'string') this.callbackUrl = config.callbackUrl
    if (typeof config.clientId === 'string') this.clientId = config.clientId
    if (typeof config.cookiePrefix === 'string') this.cookiePrefix = config.cookiePrefix
    if (typeof config.debug === 'boolean') this.debug = config.debug
    if (typeof config.ott === 'string') this.ott = config.ott
    if (typeof config.scope === 'string') this.scope = config.scope
  }

  // fetch shortcuts

  batch (fetches, options = {}) {
    return this.fetchMultiple(fetches, options)
  }

  del (options) {
    return fetchShortcut(this, 'DELETE', options)
  }

  get (options) {
    return fetchShortcut(this, 'GET', options)
  }

  post (options) {
    return fetchShortcut(this, 'POST', options)
  }

  put (options) {
    return fetchShortcut(this, 'PUT', options)
  }

  // helpers

  login (clientSecret, username, password) {
    assertNotBrowser(this)
    return oauthTokenGrantTypePassword(this, clientSecret, username, password)
  }

  refreshToken (clientSecret, refreshToken) {
    assertNotBrowser(this)
    return oauthTokenGrantTypeRefreshToken(this, clientSecret, refreshToken)
  }

  // internal methods

  _log (message) {
    if (!this.debug) {
      return message
    }

    const args = arguments
    args[0] = `[api#${this.uniqueId}] ${args[0]}`

    console.log.apply(this, args)
    return message
  }
}
