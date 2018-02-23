import expect from 'expect'

import tinhteApi from 'src/'

describe('api', () => {
  describe('fetchOne', () => {
    it('keeps full url', async () => {
      const api = tinhteApi()
      const json = await api.fetchOne('https://httpbin.org/get?foo=bar')
      expect(json.args.foo).toEqual('bar')
    })

    it('replaces ? from uri', async () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = tinhteApi({apiRoot})
      const json = await api.fetchOne('path?foo=bar')
      expect(json.url).toEqual(apiRoot + '?path&foo=bar')
    })
  })
})
