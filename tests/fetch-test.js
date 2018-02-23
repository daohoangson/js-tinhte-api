import expect from 'expect'

import tinhteApi from 'src/'

describe('api', () => {
  describe('fetchOne', () => {
    it('rejects empty uri', () => {
      const api = tinhteApi()
      return api.fetchOne('')
        .then(
          (json) => Promise.reject(new Error(json)),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

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

    it('rejects on error', () => {
      const api = tinhteApi()
      return api.fetchOne('posts/1')
        .then(
          (json) => Promise.reject(new Error(json)),
          (reason) => expect(reason).toBeAn(Error)
        )
    })
  })

  describe('fetchMultiple', () => {
    it('does nothing if no fetches', () => {
      const api = tinhteApi()
      const batchSize = api.fetchMultiple(() => {})
      expect(batchSize).toEqual(0)
    })

    it('sends all requests at once', () => {
      const api = tinhteApi()

      const promises = []
      const batchSize = api.fetchMultiple(() => {
        promises.push(api.fetchOne('index').catch(e => e))
        promises.push(api.fetchOne('threads/1').catch(e => e))
        promises.push(api.fetchOne('posts/1').catch(e => e))
      })
      expect(batchSize).toEqual(promises.length)

      return Promise.all(promises)
        .then(() => {
          expect(api.getFetchCount()).toEqual(1)
        })
    })
  })
})
