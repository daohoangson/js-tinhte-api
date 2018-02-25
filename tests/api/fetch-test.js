import expect from 'expect'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('fetchOne', () => {
    it('rejects empty uri', () => {
      const api = apiFactory()
      return api.fetchOne('')
        .then(
          (json) => Promise.reject(new Error(JSON.stringify(json))),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

    it('keeps full url', () => {
      const api = apiFactory()
      const url = 'https://httpbin.org/get?foo=bar'
      return api.fetchOne(url)
        .then((json) => {
          expect(json.url).toBe(url)
        })
    })

    it('replaces ? from uri', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      return api.fetchOne('path?foo=bar')
        .then((json) => {
          expect(json.url).toBe(apiRoot + '?path&foo=bar')
        })
    })

    it('includes token', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({
        apiRoot,
        auth: {access_token: accessToken}
      })
      return api.fetchOne('path')
        .then((json) => {
          expect(json.args.oauth_token).toBe(accessToken)
        })
    })

    it('rejects on error', () => {
      const api = apiFactory()
      return api.fetchOne('posts/1')
        .then(
          (json) => Promise.reject(new Error(JSON.stringify(json))),
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
          (jobs) => Promise.reject(new Error(JSON.stringify(jobs))),
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
          expect(Object.keys(jobs).length).toBe(3)
          expect(api.getFetchCount()).toBe(1)
        })
    })

    it('sends sub-request headers', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      const oneHeaders = {'One': `${Math.random()}`}
      const twoHeaders = {'Two': `${Math.random()}`}
      const fetches = () => {
        api.fetchOne('one', 'GET', oneHeaders).catch(e => e)
        api.fetchOne('two', 'GET', twoHeaders).catch(e => e)
      }

      return api.fetchMultiple(fetches)
        .then(
          (jobs) => Promise.reject(new Error(JSON.stringify(jobs))),
          (reason) => {
            const json = JSON.parse(reason.message)
            expect(json).toContainKey('headers')

            const { headers } = json
            expect(headers).toContain(oneHeaders)
            expect(headers).toContain(twoHeaders)
          }
        )
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
          expect(Object.keys(jobs).length).toBe(2)

          expect(posts1).toBe(2)
          expect(posts2).toBe(1)
          expect(api.getFetchCount()).toBe(1)
        })
    })
  })
})
