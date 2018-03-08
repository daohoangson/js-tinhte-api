import FormData from 'form-data'
import expect from 'expect'
import md5 from 'md5'

import { apiFactory } from 'src/'
import fetchBatchFactory from 'src/fetches/batch'
import fetchMultipleInit from 'src/fetches/fetchMultiple'
import fetchOneInit from 'src/fetches/fetchOne'
import errors from 'src/helpers/errors'

describe('api', () => {
  describe('fetchOne', function () {
    afterEach(() => {
      global.XenForo = null
      global.XF = null
    })

    it('uses root url', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      return api.fetchOne()
        .then((json) => expect(json.url).toBe(apiRoot))
    })

    it('keeps full url', () => {
      const api = apiFactory()
      const url = 'https://httpbin.org/get?foo=bar'
      return api.fetchOne(url)
        .then((json) => expect(json.url).toBe(url))
    })

    it('replaces ? from uri', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot})
      return api.fetchOne('path?foo=bar')
        .then((json) => expect(json.url).toBe(apiRoot + '?path&foo=bar'))
    })

    it('keeps oauth_token in url', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, auth: {accessToken}})
      const oauthToken = `${Math.random()}`
      return api.fetchOne(`path?oauth_token=${oauthToken}`)
        .then((json) => expect(json.args.oauth_token).toBe(oauthToken))
    })

    it('includes access token', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, auth: {accessToken}})
      return api.fetchOne('path')
        .then((json) => expect(json.args.oauth_token).toBe(accessToken))
    })

    it('includes one time token', () => {
      const ott = 'one time token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({apiRoot, ott})
      return api.fetchOne('path')
        .then((json) => expect(json.args.oauth_token).toBe(ott))
    })

    describe('XenForo 1 csrf token', () => {
      const testXenForo1CsrfToken = (csrfToken, uri) => {
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
        return api.fetchOne(uri)
      }

      it('includes it', () => {
        const csrfToken = `csrf token ${Math.random()}`
        const uri = 'xenforo1'
        return testXenForo1CsrfToken(csrfToken, uri)
          .then((json) => expect(json.args._xfToken).toBe(csrfToken))
      })

      it('keeps value from uri', () => {
        const csrfToken = `csrf token ${Math.random()}`
        const uriValue = `xf token ${Math.random()}`
        const uri = `xenforo1?_xfToken=${uriValue}`
        return testXenForo1CsrfToken(csrfToken, uri)
          .then((json) => expect(json.args._xfToken).toBe(uriValue))
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
        .then((json) => expect(json.args._xfToken).toBe(csrf))
    })

    it('rejects on error', () => {
      const api = apiFactory()
      return api.fetchOne('posts/1')
        .then(
          (json) => Promise.reject(new Error(JSON.stringify(json))),
          (reason) => expect(reason).toBeAn(Error)
        )
    })

    describe('shortcut', () => {
      const testShortcut = (apiMethod, expectedJsonMethod) => {
        const apiRoot = 'https://httpbin.org/anything'
        const uri = `uri${Math.random()}`
        const api = apiFactory({apiRoot})
        return api[apiMethod](uri)
          .then((json) => {
            expect(json.method).toBe(expectedJsonMethod)
            expect(json.url).toBe(`${apiRoot}?${uri}`)
          })
      }

      it('deletes', () => testShortcut('del', 'DELETE'))
      it('gets', () => testShortcut('get', 'GET'))
      it('posts', () => testShortcut('post', 'POST'))
      it('puts', () => testShortcut('put', 'PUT'))

      it('posts params', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({apiRoot})
        const options = {params: {foo: `foo${Math.random()}`}}
        return api.post(options)
          .then((json) => expect(json.args.foo).toBe(options.params.foo))
      })

      it('posts form data', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({apiRoot})
        const body = new FormData()
        const foo = `foo${Math.random()}`
        body.append('foo', foo)
        const options = {body}
        return api.post(options)
          .then((json) => expect(json.form.foo).toBe(foo))
      })

      it('posts json', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({apiRoot})
        const bodyJson = {foo: `foo${Math.random()}`}
        const options = {
          body: JSON.stringify(bodyJson),
          headers: {'Content-Type': 'application/json'}
        }
        return api.post(options)
          .then((json) => expect(json.json.foo).toBe(bodyJson.foo))
      })

      it('posts raw body', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({apiRoot})
        const body = 'foo'
        const options = {body}
        return api.post(options)
          .then((json) => expect(json.data).toBe(body))
      })
    })
  })

  describe('fetchMultiple', function () {
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
        api.fetchOne({uri: 'one', headers: {...oneHeaders, 'Content-Type': 'foo'}}).catch(e => e)
        api.fetchOne({uri: 'two', headers: twoHeaders}).catch(e => e)
      }

      return api.fetchMultiple(fetches)
        .then((json) => {
          const { headers } = json
          expect(headers).toContain(oneHeaders)
          expect(headers).toContain(twoHeaders)
          expect(headers['Content-Type']).toBe('application/json')
        })
    })

    describe('sub-request data', () => {
      const testSubRequestData = (optionsOverwrite, callback) => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({apiRoot})
        const method = `METHOD${Math.random()}`
        const uri = `uri${Math.random()}`
        const params = {foo: `foo${Math.random()}`}
        const options = {method, uri, params, ...optionsOverwrite}
        const fetches = () => api.fetchOne(options).catch(e => e)
        return api.fetchMultiple(fetches)
          .then((json) => callback(json.json[0], {method, uri, params}))
      }

      it('sends method, params, uri', () => {
        return testSubRequestData({}, (received, sent) => {
          expect(received.id).toBeA('string')
          expect(received.method).toBe(sent.method)
          expect(received.uri).toBe(sent.uri)
          expect(received.params).toEqual(sent.params)
          expect(Object.keys(received).length).toBe(4)
        })
      })

      it('skips method GET', () => testSubRequestData({method: 'GET'}, (received) => {
        expect(received.method).toBeAn('undefined')
        expect(Object.keys(received).length).toBe(3)
      }))

      it('sends \'index\' as uri', () => testSubRequestData({uri: ''}, (received) => {
        expect(received.uri).toBe('index')
        expect(Object.keys(received).length).toBe(4)
      }))

      it('skips params empty', () => testSubRequestData({params: {}}, (received) => {
        expect(received.params).toBeAn('undefined')
        expect(Object.keys(received).length).toBe(3)
      }))
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

    it('works if being called within another', () => {
      const api = apiFactory()

      const fetches1 = () => {
        api.fetchOne('posts/1').catch(e => e)
        api.fetchOne('posts/2').catch(e => e)
      }
      const fetches2 = () => {
        api.fetchOne('posts/3').catch(e => e)
        api.fetchOne('posts/4').catch(e => e)
        api.fetchOne('posts/5').catch(e => e)
      }

      return api.fetchMultiple(() => {
        fetches1()
        return api.fetchMultiple(fetches2)
          .then((json) => {
            expect(Object.keys(json.jobs)).toContain(md5('GET posts/3?'))
            expect(Object.keys(json.jobs)).toContain(md5('GET posts/4?'))
            expect(Object.keys(json.jobs)).toContain(md5('GET posts/5?'))
            expect(api.getFetchCount()).toBe(1)
          })
      }).then((json) => {
        expect(Object.keys(json.jobs)).toContain(md5('GET posts/1?'))
        expect(Object.keys(json.jobs)).toContain(md5('GET posts/2?'))
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
      const mockedInternalApi = {log: console.log}
      mockedFetchMultiple = fetchMultipleInit(mockedFetchJson, mockedBatch, mockedInternalApi)
      mockedFetchOne = fetchOneInit(mockedFetchJson, mockedBatch, mockedInternalApi)
    })

    it('handles unknown job in response', () => {
      mockedResponse = {jobs: {foo: 'bar'}}
      let catched = []

      return mockedFetchMultiple(() => mockedFetchOne('index').catch(reason => (catched.push(reason))))
        .then((json) => {
          expect(json._handled).toBe(1)
          expect(catched.length).toBe(1)
          expect(catched[0].message).toBe(errors.FETCH_MULTIPLE.JOB_NOT_FOUND)
        })
    })

    it('handles uniqueId clash', () => {
      const uniqueId = `uniqueId${Math.random()}`
      const job = {_job_result: 'ok', foo: Math.random()}
      mockedResponse = {jobs: {[uniqueId]: job}}
      const jsons = []
      const catched = []

      return mockedFetchMultiple(() => {
        mockedFetchOne('one').then((json) => jsons.push(json))
        mockedFetchOne('two').catch((reason) => catched.push(reason))
        mockedReqs[0].uniqueId = uniqueId
        mockedReqs[1].uniqueId = uniqueId
      }).then((json) => {
        expect(json._handled).toBe(2)
        expect(jsons.length).toBe(1)
        expect(jsons[0].foo).toBe(job.foo)
        expect(catched.length).toBe(1)
        expect(catched[0].message).toBe(errors.FETCH_MULTIPLE.MISMATCHED)
      })
    })

    it('handles non-string _job_result', () => {
      const uri = `uri${Math.random()}`
      const job = {_job_result: false, foo: Math.random()}
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = {jobs: {[uniqueId]: job}}
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(json => catched.push(json)))
        .then((json) => {
          expect(json._handled).toBe(1)
          expect(catched.length).toBe(1)
          expect(catched[0].foo).toBe(job.foo)
        })
    })

    it('handles _job_error', () => {
      const uri = `uri${Math.random()}`
      const job = {_job_result: 'error', _job_error: `job error ${Math.random()}`}
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = {jobs: {[uniqueId]: job}}
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(reason => catched.push(reason)))
        .then((json) => {
          expect(json._handled).toBe(1)
          expect(catched.length).toBe(1)
          expect(catched[0].message).toBe(job._job_error)
        })
    })

    it('handles non-ok _job_result without _job_error', () => {
      const uri = `uri${Math.random()}`
      const job = {_job_result: 'foo', bar: Math.random()}
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = {jobs: {[uniqueId]: job}}
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(reason => catched.push(reason)))
        .then((json) => {
          expect(json._handled).toBe(1)
          expect(catched.length).toBe(1)
          expect(catched[0].bar).toBe(job.bar)
        })
    })
  })
})
