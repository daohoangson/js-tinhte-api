import { expect } from '@esm-bundle/chai'

import apiFactory from './factory'

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

      expect(api2.getApiRoot()).equals(apiConfig.apiRoot)
      expect(api2.getAccessToken()).equals(apiConfig.auth.accessToken)
      expect(api2.getUserId()).equals(apiConfig.auth.userId)
      expect(api2.getCallbackUrl()).equals(apiConfig.callbackUrl)
      expect(api2.getClientId()).equals(apiConfig.clientId)
      expect(api2.getCookiePrefix()).equals(apiConfig.cookiePrefix)
      expect(api2.getDebug()).equals(apiConfig.debug)
      expect(api2.getOtt()).equals(apiConfig.ott)
      expect(api2.getScope()).equals(apiConfig.scope)
    })
  })

  describe('generateOneTimeToken', () => {
    it('returns token', () => {
      const clientId = 'ci'
      const clientSecret = 'cs'
      const userId = 123
      const api = apiFactory({ auth: { userId }, clientId })
      const regEx = new RegExp(`^${userId},\\d+,\\w{32},${clientId}`)

      const ott = api.generateOneTimeToken(clientSecret)
      expect(ott).matches(regEx)
    })

    it('accepts ttl', () => {
      const api = apiFactory()
      const ott = api.generateOneTimeToken('cs', 0)

      const m = ott.match(/^0,(\d+),/)
      const timestamp = parseInt(m[1])
      expect(timestamp).equals(Math.floor(new Date().getTime() / 1000))
    })

    it('accepts exact date', () => {
      const clientId = 'ci'
      const api = apiFactory({ clientId })
      const timestamp = 123456
      const date = new Date(timestamp * 1000)

      expect(api.generateOneTimeToken('cs', date)).equals(`0,${timestamp},54aeb4733955fe782fd69b1b2d30235d,${clientId}`)
    })
  })

  describe('getAccessToken', () => {
    it('returns default empty string', () => {
      const api = apiFactory()
      expect(api.getAccessToken()).equals('')
    })
  })

  describe('getCookiePrefix', () => {
    it('returns default cookie prefix', () => {
      const api = apiFactory()
      expect(api.getCookiePrefix()).equals('')
    })
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = apiFactory()
      expect(api.getUserId()).equals(0)
    })
  })

  describe('hasAuth', () => {
    it('returns false', () => {
      const api = apiFactory()
      expect(api.hasAuth()).equals(false)
    })

    it('returns true', () => {
      const auth = {}
      const api = apiFactory({ auth })
      expect(api.hasAuth()).equals(true)
    })
  })
})
