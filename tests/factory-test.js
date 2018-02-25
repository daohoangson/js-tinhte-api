import expect from 'expect'

import { apiFactory } from 'src/'

describe('apiFactory', () => {
  it('accepts non-object', () => {
    const api = apiFactory('foo')
    expect(api).toBeAn('object')
  })

  it('accepts auth.access_token', () => {
    const accessToken = 'at' + Math.random()
    const api = apiFactory({
      auth: {access_token: accessToken},
      apiRoot: 'https://httpbin.org/anything'
    })

    return api.fetchOne('test')
      .then((json) => {
        expect(json.args.oauth_token).toEqual(accessToken)
      })
  })

  it('accepts auth.user_id', () => {
    const userId = Math.random()
    const api = apiFactory({auth: {user_id: userId}})

    expect(api.getUserId()).toEqual(userId)
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = apiFactory({auth: {user_id: 0}})
      const userId = api.getUserId()
      expect(userId).toEqual(0)
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
