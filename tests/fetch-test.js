import expect from 'expect'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('fetchOne', () => {
    it('rejects empty uri', () => {
      const api = apiFactory()
      return api.fetchOne('')
        .then(
          (json) => Promise.reject(new Error(json)),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

    it('keeps full url', () => {
      const api = apiFactory()
      return api.fetchOne('https://httpbin.org/get?foo=bar')
        .then((json) => {
          expect(json.args.foo).toEqual('bar')
        })
    })

    it('replaces ? from uri', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      return api.fetchOne('path?foo=bar')
        .then((json) => {
          expect(json.url).toEqual(apiRoot + '?path&foo=bar')
        })
    })

    it('rejects on error', () => {
      const api = apiFactory()
      return api.fetchOne('posts/1')
        .then(
          (json) => Promise.reject(new Error(json)),
          (reason) => expect(reason).toBeAn(Error)
        )
    })
  })

  describe('fetchMultiple', () => {
    it('does nothing if no fetches', () => {
      const api = apiFactory()
      const fetches = () => {}

      return api.fetchMultiple(fetches)
        .then(
          (responses) => Promise.reject(new Error(responses)),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

    it('sends all requests at once', () => {
      const api = apiFactory()
      const fetches = () => {
        api.fetchOne('index').catch(e => e)
        api.fetchOne('threads/1').catch(e => e)
        api.fetchOne('posts/1').catch(e => e)
      }

      return api.fetchMultiple(fetches)
        .then((jobs) => {
          expect(Object.keys(jobs).length).toEqual(3)
          expect(api.getFetchCount()).toEqual(1)
        })
    })

    it('skips duplicate requests', () => {
      const api = apiFactory()

      let posts1 = 0
      let posts2 = 0
      const fetches = () => {
        api.fetchOne('posts/1').catch(e => e).then(() => { posts1++ })
        api.fetchOne('posts/2').catch(e => e).then(() => { posts2++ })
        api.fetchOne('posts/1').catch(e => e).then(() => { posts1++ })
      }

      api.fetchMultiple(fetches)
        .then((jobs) => {
          expect(Object.keys(jobs).length).toEqual(2)

          expect(posts1).toEqual(2)
          expect(posts2).toEqual(1)
          expect(api.getFetchCount()).toEqual(1)
        })
    })
  })
})
