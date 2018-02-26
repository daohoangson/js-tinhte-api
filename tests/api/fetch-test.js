import expect from 'expect'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('fetchOne', () => {
    afterEach(() => {
      global.XenForo = null
      global.XF = null
    })

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

    it('includes XenForo 1 csrf token', () => {
      const csrfToken = `csrf token ${Math.random()}`
      global.XenForo = {
        visitor: {
          user_id: Math.random()
        },
        _csrfToken: csrfToken
      }

      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({
        apiRoot,
        auth: {access_token: 'access token'}
      })
      return api.fetchOne('xenforo1')
        .then((json) => {
          expect(json.args._xfToken).toBe(csrfToken)
        })
    })

    it('includes XenForo 2 csrf token', () => {
      const csrf = `csrf token ${Math.random()}`
      global.XF = {
        config: {
          csrf,
          userId: Math.random()
        }
      }

      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({
        apiRoot,
        auth: {access_token: 'access token'}
      })
      return api.fetchOne('xenforo2')
        .then((json) => {
          expect(json.args._xfToken).toBe(csrf)
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

      const promises = []
      let posts1 = 0
      let posts2 = 0
      const fetches = () => {
        promises.push(api.fetchOne('posts/1').catch(e => e).then(() => { posts1++ }))
        promises.push(api.fetchOne('posts/2').catch(e => e).then(() => { posts2++ }))
        promises.push(api.fetchOne('posts/1').catch(e => e).then(() => { posts1++ }))
      }

      promises.push(api.fetchMultiple(fetches).then((jobs) => expect(Object.keys(jobs).length).toBe(2)))

      return Promise.all(promises)
        .then(() => {
          expect(posts1).toBe(2, 'posts1 twice')
          expect(posts2).toBe(1, 'posts2 once')
          expect(api.getFetchCount()).toBe(1)
        })
    })
  })
})
