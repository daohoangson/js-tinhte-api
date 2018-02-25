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
      const cancel = api.onAuthenticated('foo')

      // test cancel() right here to avoid duplicated effort
      const canceled = cancel()
      expect(canceled).toBe(false)
    })

    it('executes callback if already authenticated', () => {
      const api = apiFactory({auth: {}})
      let executed = false
      const cancel = api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(true)

      // test cancel() right here to avoid duplicated effort
      const canceled = cancel()
      expect(canceled).toBe(false)
    })

    it('delays callback if not authenticated', () => {
      const api = apiFactory()
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(false)

      api.setAuth()
      expect(executed).toBe(true)
    })

    describe('cancel()', () => {
      it('prevents callback', () => {
        const api = apiFactory()
        let executed = false
        const cancel = api.onAuthenticated(() => { executed = true })

        const canceled = cancel()
        expect(canceled).toBe(true)

        api.setAuth()
        expect(executed).toBe(false)
      })

      it('works once', () => {
        const api = apiFactory()
        const cancel = api.onAuthenticated(() => {})

        const canceled1 = cancel()
        expect(canceled1).toBe(true)

        const canceled2 = cancel()
        expect(canceled2).toBe(false)
      })
    })
  })

  describe('setAuth', () => {
    it('accepts non-object', () => {
      // see onAuthenticated tests
    })

    it('accepts invalid state', () => {
      const accessToken = 'access token'
      const api = apiFactory()
      api.setAuth({
        access_token: accessToken,
        state: ''
      })

      expect(api.getAccessToken()).toBe('')
    })

    it('updates access token', () => {
      const accessToken = 'access token'
      const api = apiFactory()
      api.setAuth({
        access_token: accessToken,
        state: api.getUniqueId()
      })

      expect(api.getAccessToken()).toBe(accessToken)
    })
  })
})
