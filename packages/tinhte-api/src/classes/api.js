import { isDate } from 'lodash'

import fetchesInit from '../fetches'
import { isPlainObject, mustBePlainObject } from '../helpers'
import { hashMd5 } from '../helpers/crypt'
import oauthTokenGrantTypePassword from '../helpers/oauth/token/grantTypePassword'
import oauthTokenGrantTypeRefreshToken from '../helpers/oauth/token/grantTypeRefreshToken'

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

    this.fetches = fetchesInit(this)
    this.uniqueId = ('' + Math.random()).substr(2, 6)
  }

  clone (config) {
    return new Api(this._cloneConfig(config))
  }

  fetchMultiple (fetches, options = {}) {
    return this.fetches.fetchMultiple(fetches, options)
  }

  fetchOne (options) {
    return this.fetches.fetchOne(options)
  }

  generateOneTimeToken (clientSecret, ttl) {
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
    const auth = this.auth || {}
    return { ...auth }
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

  setAuth (newAuth) {
    this.auth = {}

    if (!isPlainObject(newAuth) || newAuth.state !== this.uniqueId) {
      return
    }

    if (typeof newAuth.access_token === 'string') {
      this.auth.accessToken = newAuth.access_token
    }

    let userId = 0
    if (typeof newAuth.user_id === 'number') {
      userId = newAuth.user_id
    } else if (typeof newAuth.user_id === 'string') {
      userId = parseInt(newAuth.user_id)
    }
    if (userId > 0) {
      this.auth.userId = userId
    }
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
    return oauthTokenGrantTypePassword(this, clientSecret, username, password)
  }

  refreshToken (clientSecret, refreshToken) {
    return oauthTokenGrantTypeRefreshToken(this, clientSecret, refreshToken)
  }

  // internal methods

  _cloneConfig (config) {
    return {
      apiRoot: this.apiRoot,
      auth: this.auth,
      callbackUrl: this.callbackUrl,
      clientId: this.clientId,
      cookiePrefix: this.cookiePrefix,
      debug: this.debug,
      ott: this.ott,
      scope: this.scope,

      ...mustBePlainObject(config)
    }
  }

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
