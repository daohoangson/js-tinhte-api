import expect from 'expect'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('clone', () => {
    it('returns instance with matched config', () => {
      const apiConfig = {
        apiRoot: 'api root',
        auth: {
          accessToken: 'access token',
          userId: Math.random()
        },
        callbackUrl: 'callback url',
        clientId: 'client ID',
        cookiePrefix: 'cookie_prefix_',
        debug: true,
        ott: 'ott',
        scope: 'scope1 scope2'
      }
      const api1 = apiFactory(apiConfig)
      const api2 = api1.clone()

      expect(api2.getApiRoot()).toBe(apiConfig.apiRoot)
      expect(api2.getAccessToken()).toBe(apiConfig.auth.accessToken)
      expect(api2.getUserId()).toBe(apiConfig.auth.userId)
      expect(api2.getCallbackUrl()).toBe(apiConfig.callbackUrl)
      expect(api2.getClientId()).toBe(apiConfig.clientId)
      expect(api2.getCookieName()).toMatch(new RegExp('^' + apiConfig.cookiePrefix))
      expect(api2.getDebug()).toBe(apiConfig.debug)
      expect(api2.getOtt()).toBe(apiConfig.ott)
      expect(api2.getScope()).toBe(apiConfig.scope)
    })
  })

  describe('generateOneTimeToken', () => {
    it('throws error if not debugging', () => {
      const api = apiFactory()

      let e
      try {
        api.generateOneTimeToken()
      } catch (something) {
        e = something
      }

      expect(e).toBeAn(Error)
    })

    it('returns token', () => {
      const clientId = 'ci'
      const clientSecret = 'cs'
      const debug = true
      const userId = 123
      const api = apiFactory({ auth: { userId }, clientId, debug })
      const regEx = new RegExp(`^${userId},\\d+,\\w{32},${clientId}`)

      const ott = api.generateOneTimeToken(clientSecret)
      expect(ott).toMatch(regEx)
    })

    it('accepts ttl', () => {
      const debug = true
      const api = apiFactory({ debug })
      const ott = api.generateOneTimeToken('cs', 0)

      const m = ott.match(/^0,(\d+),/)
      const timestamp = parseInt(m[1])
      expect(timestamp).toBe(Math.floor(new Date().getTime() / 1000))
    })

    it('accepts exact date', () => {
      const clientId = 'ci'
      const debug = true
      const api = apiFactory({ clientId, debug })
      const timestamp = 123456
      const date = new Date(timestamp * 1000)

      expect(api.generateOneTimeToken('cs', date)).toBe(`0,${timestamp},54aeb4733955fe782fd69b1b2d30235d,${clientId}`)
    })
  })

  describe('getAccessToken', () => {
    it('returns default empty string', () => {
      const api = apiFactory()
      expect(api.getAccessToken()).toBe('')
    })
  })

  describe('getCookieName', () => {
    it('returns default cookie prefix', () => {
      const clientId = 'client ID'
      const api = apiFactory({ clientId })
      expect(api.getCookieName()).toMatch(/^auth_/)
    })

    it('returns empty string without client ID', () => {
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({ cookiePrefix })
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string without cookie prefix', () => {
      const clientId = 'client ID'
      const cookiePrefix = ''
      const api = apiFactory({ clientId, cookiePrefix })
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string with unsafe client ID', () => {
      const clientId = '#'
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({ clientId, cookiePrefix })
      expect(api.getCookieName()).toBe('')
    })
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = apiFactory()
      expect(api.getUserId()).toBe(0)
    })
  })

  describe('setAuth', () => {
    it('accepts non-object', () => {
      // see onAuthenticated tests
    })

    it('accepts invalid state', () => {
      const accessToken = 'access token'
      const debug = true
      const api = apiFactory({ debug })
      const auth = {
        access_token: accessToken,
        state: ''
      }
      return api.setAuth(auth)
        .then(() => expect(api.getAccessToken()).toBe(''))
    })

    it('updates access token', () => {
      const accessToken = 'access token'
      const debug = true
      const api = apiFactory({ debug })
      const auth = {
        access_token: accessToken,
        state: api.getUniqueId()
      }
      return api.setAuth(auth)
        .then(() => expect(api.getAccessToken()).toBe(accessToken))
    })

    it('updates user id', () => {
      const userId = Math.random()
      const debug = true
      const api = apiFactory({ debug })
      const auth = {
        user_id: userId,
        state: api.getUniqueId()
      }
      return api.setAuth(auth)
        .then(() => expect(api.getUserId()).toBe(userId))
    })

    it('updates user id from string', () => {
      const userIdNumber = Math.floor(Math.random() * 1000)
      const userId = `${userIdNumber}`
      const debug = true
      const api = apiFactory({ debug })
      const auth = {
        user_id: userId,
        state: api.getUniqueId()
      }
      return api.setAuth(auth)
        .then(() => expect(api.getUserId()).toBe(userIdNumber))
    })
  })
})
