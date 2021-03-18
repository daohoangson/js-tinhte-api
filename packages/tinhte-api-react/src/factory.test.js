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

  describe('getInternalApi', () => {
    it('exposes internal (debug=true)', () => {
      const debug = true
      const api = apiFactory({ debug })
      expect(api.getInternalApi).a('function')
    })

    it('doesn\'t exposes internal (debug=fase)', () => {
      const debug = false
      const api = apiFactory({ debug })
      // eslint-disable-next-line
      expect(api.getInternalApi).is.undefined
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
        expect(api.getAccessToken()).equals('')
      })

      it('updates access token', () => {
        const accessToken = 'access token'
        const auth = {
          access_token: accessToken,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getAccessToken()).equals(accessToken)
      })

      it('handles invalid user id', () => {
        const userId = -1
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).equals(0)
      })

      it('updates user id', () => {
        const userId = Math.random()
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).equals(userId)
      })

      it('updates user id from string', () => {
        const userIdNumber = Math.floor(Math.random() * 1000)
        const userId = `${userIdNumber}`
        const auth = {
          user_id: userId,
          state: api.getUniqueId()
        }

        internalApi.setAuth(auth)
        expect(api.getUserId()).equals(userIdNumber)
      })
    })
  })
})
