import expect from 'expect'

import { apiFactory } from 'src/'

describe('apiFactory', () => {
  it('accepts non-object', () => {
    const api = apiFactory('foo')
    expect(api).toBeAn('object')
  })

  it('accepts apiRoot', () => {
    const apiRoot = 'api root'
    const api = apiFactory({apiRoot})
    expect(api.getApiRoot()).toBe(apiRoot)
  })

  it('accepts auth.access_token', () => {
    const accessToken = 'access token'
    const api = apiFactory({auth: {access_token: accessToken}})
    expect(api.getAccessToken()).toBe(accessToken)
  })

  it('accepts auth.user_id', () => {
    const userId = 1
    const api = apiFactory({auth: {user_id: userId}})
    expect(api.getUserId()).toBe(userId)
  })

  it('accepts callbackUrl', () => {
    const callbackUrl = 'callback url'
    const api = apiFactory({callbackUrl})
    expect(api.getCallbackUrl()).toBe(callbackUrl)
  })

  it('accepts clientId', () => {
    const clientId = 'client ID'
    const api = apiFactory({clientId})
    expect(api.getClientId()).toBe(clientId)
  })

  it('accepts debug', () => {
    const debug = true
    const api = apiFactory({debug})
    expect(api.getDebug()).toBe(debug)
  })

  it('accepts scope', () => {
    const scope = 'scope1 scope2'
    const api = apiFactory({scope})
    expect(api.getScope()).toBe(scope)
  })
})
