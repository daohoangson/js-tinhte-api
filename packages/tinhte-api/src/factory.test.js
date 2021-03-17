import { expect } from '@esm-bundle/chai'

import apiFactory from './factory'

describe('apiFactory', () => {
  it('accepts non-object', () => {
    const api = apiFactory('foo')
    expect(api).an('object')
  })

  it('accepts apiRoot', () => {
    const apiRoot = 'api root'
    const api = apiFactory({ apiRoot })
    expect(api.getApiRoot()).equals(apiRoot)
  })

  it('accepts auth.accessToken', () => {
    const accessToken = 'access token'
    const api = apiFactory({ auth: { accessToken } })
    expect(api.getAccessToken()).equals(accessToken)
  })

  it('accepts auth.userId', () => {
    const userId = 1
    const api = apiFactory({ auth: { userId } })
    expect(api.getUserId()).equals(userId)
  })

  it('accepts callbackUrl', () => {
    const callbackUrl = 'callback url'
    const api = apiFactory({ callbackUrl })
    expect(api.getCallbackUrl()).equals(callbackUrl)
  })

  it('accepts clientId', () => {
    const clientId = 'client ID'
    const api = apiFactory({ clientId })
    expect(api.getClientId()).equals(clientId)
  })

  it('accepts cookiePrefix', () => {
    const cookiePrefix = 'cookie_prefix_'
    const api = apiFactory({ cookiePrefix })
    expect(api.getCookiePrefix()).equals(cookiePrefix)
  })

  it('accepts debug', () => {
    const debug = true
    const api = apiFactory({ debug })
    expect(api.getDebug()).equals(debug)

    // run the logging code path for debug mode
    return api.get('index').catch(() => { })
  })

  it('accepts ott', () => {
    const ott = 'ott'
    const api = apiFactory({ ott })
    expect(api.getOtt()).equals(ott)
  })

  it('accepts scope', () => {
    const scope = 'scope1 scope2'
    const api = apiFactory({ scope })
    expect(api.getScope()).equals(scope)
  })
})
