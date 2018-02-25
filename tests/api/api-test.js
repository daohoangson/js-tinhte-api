import expect from 'expect'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('getAccessToken', () => {
    it('returns default empty string', () => {
      const api = apiFactory()
      expect(api.getAccessToken()).toBe('')
    })
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = apiFactory()
      expect(api.getUserId()).toBe(0)
    })
  })

  describe('onAuthenticated', () => {
    it('accepts non-func', () => {
      const api = apiFactory()
      api.onAuthenticated('foo')
    })

    it('executes callback if already authenticated', () => {
      const api = apiFactory({auth: {}})
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(true)
    })

    it('delays callback if not authenticated', () => {
      const api = apiFactory()
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(false)
    })
  })
})
