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

  describe('internalApi', () => {
    describe('setAuth', () => {
      let api = null
      let internalApi = null

      beforeEach(() => {
        const debug = true
        api = apiFactory({ debug })
        internalApi = api.getInternalApi()
      })

      it('handles invalid state', () => {
        const accessToken = 'access token'
        const auth = {
          access_token: accessToken,
          state: ''
        }

        internalApi.setAuth(auth)
        expect(api.getAccessToken()).toBe('')
      })

      it('updates access token', () => {
        const accessToken = 'access token'
        const auth = {
          access_token: accessToken,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getAccessToken()).toBe(accessToken)
      })

      it('handles invalid user id', () => {
        const userId = -1
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).toBe(0)
      })

      it('updates user id', () => {
        const userId = Math.random()
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).toBe(userId)
      })

      it('updates user id from string', () => {
        const userIdNumber = Math.floor(Math.random() * 1000)
        const userId = `${userIdNumber}`
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).toBe(userIdNumber)
      })
    })
  })
})
