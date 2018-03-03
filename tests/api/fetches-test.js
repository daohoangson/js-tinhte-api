import expect from 'expect'

import { apiFactory } from 'src/'
import fetchBatchFactory from 'src/fetches/batch'
import fetchMultipleInit from 'src/fetches/fetchMultiple'
import fetchOneInit from 'src/fetches/fetchOne'

describe('api', () => {
  describe('fetchOne', function () {
    this.timeout(10000)

    afterEach(() => {
      global.XenForo = null
      global.XF = null
    })

    it('rejects bad params', () => {
      const api = apiFactory()
      return api.fetchOne(false, false, false, false)
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

    it('keeps oauth_token in url', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, auth: {accessToken}})
      const oauthToken = `${Math.random()}`
      return api.fetchOne(`path?oauth_token=${oauthToken}`)
        .then((json) => {
          expect(json.args.oauth_token).toBe(oauthToken)
        })
    })

    it('includes access token', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, auth: {accessToken}})
      return api.fetchOne('path')
        .then((json) => {
          expect(json.args.oauth_token).toBe(accessToken)
        })
    })

    it('includes one time token', () => {
      const ott = 'one time token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, ott})
      return api.fetchOne('path')
        .then((json) => {
          expect(json.args.oauth_token).toBe(ott)
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
        auth: {accessToken: 'access token'}
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
        auth: {accessToken: 'access token'}
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

  describe('fetchMultiple', function () {
    this.timeout(10000)

    it('does nothing if no fetches', () => {
      const api = apiFactory()
      const fetches = () => {}

      return api.fetchMultiple(fetches)
        .then(
          (json) => Promise.reject(new Error(JSON.stringify(json))),
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
        .then((json) => {
          expect(Object.keys(json.jobs).length).toBe(3)
          expect(json._handled).toBe(3)
          expect(api.getFetchCount()).toBe(1)
        })
    })

    it('sends sub-request headers', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      const oneHeaders = {One: `${Math.random()}`}
      const twoHeaders = {Two: `${Math.random()}`}
      const fetches = () => {
        api.fetchOne('one', 'GET', {...oneHeaders, 'Content-Type': 'foo'}).catch(e => e)
        api.fetchOne('two', 'GET', twoHeaders).catch(e => e)
      }

      return api.fetchMultiple(fetches)
        .then((json) => {
          expect(json).toContainKey('headers')

          const { headers } = json
          expect(headers).toContain(oneHeaders)
          expect(headers).toContain(twoHeaders)
          expect(headers['Content-Type']).toBe('application/json')
        })
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

      promises.push(api.fetchMultiple(fetches).then((json) => {
        expect(Object.keys(json.jobs).length).toBe(2)
        expect(json._handled).toBe(3)
      }))

      return Promise.all(promises)
        .then(() => {
          expect(posts1).toBe(2, 'posts1 twice')
          expect(posts2).toBe(1, 'posts2 once')
          expect(api.getFetchCount()).toBe(1)
        })
    })

    it('accepts non-object options', () => {
      const api = apiFactory()
      const fetches = () => {}

      return api.fetchMultiple(fetches, 'foo')
        .then(
          (json) => Promise.reject(new Error(JSON.stringify(json))),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

    it('does not trigger handlers', () => {
      const api = apiFactory()

      const fetches = () => {
        api.fetchOne('posts/1').catch(e => e)
        api.fetchOne('posts/2').catch(e => e)
        api.fetchOne('posts/3').catch(e => e)
      }

      return api.fetchMultiple(fetches, {triggerHandlers: false})
        .then((json) => {
          expect(Object.keys(json.jobs).length).toBe(3)
          expect(json._handled).toBe(0)
          expect(api.getFetchCount()).toBe(1)
        })
    })
  })

  describe('fetchMultiple internal', () => {
    const mockedReqs = []
    const mockedBatch = fetchBatchFactory(mockedReqs)
    let mockedFetchOne
    let mockedFetchMultiple
    let mockedResponse

    beforeEach(() => {
      const mockedFetchJson = () => new Promise((resolve) => setTimeout(() => resolve(mockedResponse), 10))
      const mockedInternalApi = {
        log: console.log
      }
      mockedFetchMultiple = fetchMultipleInit(mockedFetchJson, mockedBatch, mockedInternalApi)
      mockedFetchOne = fetchOneInit(mockedFetchJson, mockedBatch, mockedInternalApi)
    })

    it('handles unknown job in response', () => {
      mockedResponse = {jobs: {foo: 'bar'}}
      return mockedFetchMultiple(() => {
        mockedFetchOne('index').catch(e => e)
      }).then((json) => expect(json._handled).toBe(1))
    })

    it('handles uniqueId clash', () => {
      const uniqueId = `uniqueId${Math.random()}`
      mockedResponse = {jobs: {[uniqueId]: {foo: 'bar'}}}
      return mockedFetchMultiple(() => {
        mockedFetchOne('one').catch(e => e)
        mockedFetchOne('two').catch(e => e)
        mockedReqs[0].uniqueId = uniqueId
        mockedReqs[1].uniqueId = uniqueId
      }).then((json) => expect(json._handled).toBe(2))
    })

    it('handles non-string _job_result', () => {
      const uniqueId = 'de160058e184557c638f82156445ceb2'
      mockedResponse = {jobs: {[uniqueId]: {_job_result: false}}}
      return mockedFetchMultiple(() => {
        mockedFetchOne('index').catch(e => e)
      }).then((json) => expect(json._handled).toBe(1))
    })

    it('handles unexpected _job_result string', () => {
      const uniqueId = 'de160058e184557c638f82156445ceb2'
      mockedResponse = {jobs: {[uniqueId]: {_job_result: 'foo'}}}
      return mockedFetchMultiple(() => {
        mockedFetchOne('index').catch(e => e)
      }).then((json) => expect(json._handled).toBe(1))
    })
  })
})
