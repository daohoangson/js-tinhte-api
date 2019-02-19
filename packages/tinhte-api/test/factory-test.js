import expect from 'expect'

import { apiFactory } from 'src/'

describe('apiFactory', () => {
  it('accepts non-object', () => {
    const api = apiFactory('foo')
    expect(api).toBeAn('object')
  })

  it('accepts apiRoot', () => {
    const apiRoot = 'api root'
    const api = apiFactory({ apiRoot })
    expect(api.getApiRoot()).toBe(apiRoot)
  })

  it('accepts auth.accessToken', () => {
    const accessToken = 'access token'
    const api = apiFactory({ auth: { accessToken } })
    expect(api.getAccessToken()).toBe(accessToken)
  })

  it('accepts auth.userId', () => {
    const userId = 1
    const api = apiFactory({ auth: { userId } })
    expect(api.getUserId()).toBe(userId)
  })

  it('accepts callbackUrl', () => {
    const callbackUrl = 'callback url'
    const api = apiFactory({ callbackUrl })
    expect(api.getCallbackUrl()).toBe(callbackUrl)
  })

  it('accepts clientId', () => {
    const clientId = 'client ID'
    const api = apiFactory({ clientId })
    expect(api.getClientId()).toBe(clientId)
  })

  it('accepts cookiePrefix', () => {
    const cookiePrefix = 'cookie prefix'
    const clientId = 'client ID'
    const api = apiFactory({ clientId, cookiePrefix })
    const regEx = new RegExp('^' + cookiePrefix)
    expect(api.getCookieName()).toMatch(regEx)
  })

  it('accepts debug', () => {
    const debug = true
    const api = apiFactory({ debug })
    expect(api.getDebug()).toBe(debug)
  })

  it('accepts ott', () => {
    const ott = 'ott'
    const api = apiFactory({ ott })
    expect(api.getOtt()).toBe(ott)
  })

  it('accepts scope', () => {
    const scope = 'scope1 scope2'
    const api = apiFactory({ scope })
    expect(api.getScope()).toBe(scope)
  })
})
