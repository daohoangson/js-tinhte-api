import expect from 'expect'
import React from 'react'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('fetchApiDataForProvider', () => {
    it('returns jobs', () => {
      const api = apiFactory()

      const Child = () => <div>foo</div>
      Child.apiFetches = {
        index: {
          uri: 'index'
        }
      }
      const C = api.ConsumerHoc(Child)

      const Parent = ({ children }) => <div>{children}</div>
      const P = api.ProviderHoc(Parent)

      return api.fetchApiDataForProvider(<P><C /></P>)
        .then((apiData) => {
          expect(Object.keys(apiData)).toContain('de160058e184557c638f82156445ceb2')
        })
    })

    it('handles no children', () => {
      const api = apiFactory()
      const Component = () => <div>foo</div>
      const P = api.ProviderHoc(Component)

      return api.fetchApiDataForProvider(<P />)
        .then((apiData) => {
          expect(Object.keys(apiData).length).toBe(0)
        })
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
      const api = apiFactory({
        auth: {user_id: userId},
        clientId,
        debug
      })
      const regEx = new RegExp(`^${userId},\\d+,\\w{32},${clientId}`)

      const ott = api.generateOneTimeToken(clientSecret)
      expect(ott).toMatch(regEx)
      expect(api.getOtt()).toBe(ott)
    })

    it('accepts ttl', () => {
      const debug = true
      const api = apiFactory({debug})
      const ott = api.generateOneTimeToken('cs', 0)

      const m = ott.match(/^0,(\d+),/)
      const timestamp = parseInt(m[1])
      expect(timestamp).toBe(Math.floor(new Date().getTime() / 1000))
    })

    it('accepts exact date', () => {
      const clientId = 'ci'
      const debug = true
      const api = apiFactory({clientId, debug})
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
      const api = apiFactory({clientId})
      expect(api.getCookieName()).toMatch(/^auth_/)
    })

    it('returns empty string without client ID', () => {
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({cookiePrefix})
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string without cookie prefix', () => {
      const clientId = 'client ID'
      const cookiePrefix = ''
      const api = apiFactory({clientId, cookiePrefix})
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string with unsafe client ID', () => {
      const clientId = '#'
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({clientId, cookiePrefix})
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
    it('throws error if not debugging', () => {
      const api = apiFactory()

      let e
      try {
        api.setAuth()
      } catch (something) {
        e = something
      }

      expect(e).toBeAn(Error)
    })

    it('accepts non-object', () => {
      // see onAuthenticated tests
    })

    it('accepts invalid state', () => {
      const accessToken = 'access token'
      const debug = true
      const api = apiFactory({debug})
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
      const api = apiFactory({debug})
      const auth = {
        access_token: accessToken,
        state: api.getUniqueId()
      }
      return api.setAuth(auth)
        .then(() => expect(api.getAccessToken()).toBe(accessToken))
    })
  })
})
