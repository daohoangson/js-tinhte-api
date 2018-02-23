import expect from 'expect'

import tinhteApi from 'src/'

describe('api', () => {
  it('accepts non-object', () => {
    const api = tinhteApi('foo')
    expect(api).toBeAn('object')
  })

  it('accepts auth.access_token', async () => {
    const accessToken = 'at' + Math.random()
    const api = tinhteApi({
      auth: {access_token: accessToken},
      apiRoot: 'https://httpbin.org/anything'
    })

    const json = await api.fetchOne('test')
    expect(json.args.oauth_token).toEqual(accessToken)
  })

  it('accepts auth.user_id', () => {
    const userId = Math.random()
    const api = tinhteApi({auth: {user_id: userId}})

    expect(api.getUserId()).toEqual(userId)
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = tinhteApi({auth: {user_id: 0}})
      const userId = api.getUserId()
      expect(userId).toEqual(0)
    })
  })

  describe('onAuthenticated', () => {
    it('accepts non-func', () => {
      const api = tinhteApi()
      api.onAuthenticated('foo')
    })

    it('executes callback if already authenticated', () => {
      const api = tinhteApi({auth: {}})
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(true)
    })

    it('delays callback if not authenticated', () => {
      const api = tinhteApi()
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(false)
    })
  })
})
