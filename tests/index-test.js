import expect from 'expect'

import tinhteApi from 'src/'

describe('api', () => {
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
    const userId = Math.random() * 9999 + 1
    const api = tinhteApi({auth: {user_id: userId}})

    expect(api.getUserId()).toEqual(userId)
  })
})
