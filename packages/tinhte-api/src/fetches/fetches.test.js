import { expect } from '@esm-bundle/chai'

import apiFactory from '../factory'
import fetchBatchFactory from './batch'
import fetchMultipleInit from './fetchMultiple'
import fetchOneInit from './fetchOne'
import errors from '../helpers/errors'
import { hashMd5 as md5 } from '../helpers/crypt'

describe('api', () => {
  describe('fetchOne', function () {
    afterEach(() => {
      window.XenForo = null
      window.XF = null
    })

    it('uses root url', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot })
      return api.fetchOne()
        .then((json) => expect(json.url).equals(apiRoot))
    })

    describe('full uri', () => {
      it('keeps original value', () => {
        const api = apiFactory()
        const url = 'https://httpbin.org/get?action&foo=1&bar=2'
        return api.fetchOne(url)
          .then((json) => expect(json.url).equals(url))
      })

      it('keeps oauth_token', () => {
        const accessToken = `at${Math.random()}`
        const api = apiFactory({ auth: { accessToken } })
        const url = `https://httpbin.org/get?action&oauth_token=${Math.random()}`
        return api.fetchOne(url)
          .then((json) => expect(json.url).equals(url))
      })

      it('includes access token', () => {
        const accessToken = `at${Math.random()}`
        const api = apiFactory({ auth: { accessToken } })
        const url = 'https://httpbin.org/get'
        return api.fetchOne(url)
          .then((json) => expect(json.args.oauth_token).equals(accessToken))
      })
    })

    it('replaces ? from uri', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot })
      return api.fetchOne('path?foo=bar')
        .then((json) => expect(json.url).equals(apiRoot + '?path&foo=bar'))
    })

    it('keeps oauth_token in url', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot, auth: { accessToken } })
      const oauthToken = `${Math.random()}`
      return api.fetchOne(`path?oauth_token=${oauthToken}`)
        .then((json) => expect(json.args.oauth_token).equals(oauthToken))
    })

    it('includes access token', () => {
      const accessToken = 'access token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot, auth: { accessToken } })
      return api.fetchOne('path')
        .then((json) => expect(json.args.oauth_token).equals(accessToken))
    })

    it('includes one time token', () => {
      const ott = 'one time token'
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot, ott })
      return api.fetchOne('path')
        .then((json) => expect(json.args.oauth_token).equals(ott))
    })

    describe('XenForo 1 csrf token', () => {
      const testXenForo1CsrfToken = (csrfToken, uri) => {
        window.XenForo = {
          visitor: {
            user_id: Math.random()
          },
          _csrfToken: csrfToken
        }

        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({
          apiRoot,
          auth: { accessToken: 'access token' }
        })
        return api.fetchOne(uri)
      }

      it('includes it', () => {
        const csrfToken = `csrf token ${Math.random()}`
        const uri = 'xenforo1'
        return testXenForo1CsrfToken(csrfToken, uri)
          .then((json) => expect(json.args._xfToken).equals(csrfToken))
      })

      it('keeps value from uri', () => {
        const csrfToken = `csrf token ${Math.random()}`
        const uriValue = `xf token ${Math.random()}`
        const uri = `xenforo1?_xfToken=${uriValue}`
        return testXenForo1CsrfToken(csrfToken, uri)
          .then((json) => expect(json.args._xfToken).equals(uriValue))
      })
    })

    it('includes XenForo 2 csrf token', () => {
      const csrf = `csrf token ${Math.random()}`
      window.XF = {
        config: {
          csrf,
          userId: Math.random()
        }
      }

      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({
        apiRoot,
        auth: { accessToken: 'access token' }
      })
      return api.fetchOne('xenforo2')
        .then((json) => expect(json.args._xfToken).equals(csrf))
    })

    it('includes configured default headers', () => {
      const apiRoot = 'https://httpbin.org/headers'
      const headers = { A: '1', B: 2, C: { x: 'y' }, D: null, E: undefined, F: '6', G: '7' }
      const api = apiFactory({ apiRoot, headers })

      return api.fetchOne({ uri: '/', headers: { F: undefined, G: 8 } })
        .then((json) => {
          const { A, B, C, D, E, G } = json.headers
          expect(A).equals(headers.A)
          expect(B).equals(headers.B.toString())
          expect(C).equals('[object Object]')
          expect(D).equals('null')
          expect(E).equals('undefined')
          expect('F' in json.headers).equals(false)
          expect(G).equals('8')
        })
    })

    it('rejects on errors (array)', () => {
      const apiRoot = 'https://xfrocks.com/api/index.php'
      const api = apiFactory({ apiRoot })
      return api.fetchOne('posts/1')
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason.message).equals('The requested post could not be found.')
        )
    })

    it('rejects on errors (object)', () => {
      const apiRoot = 'https://xfrocks.com/api/index.php'
      const api = apiFactory({ apiRoot })
      return api.post({ uri: 'users', params: { client_id: 'gljf4391k3' } })
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => {
            expect(reason.message).contains('email:')
            expect(reason.message).contains('username:')
          }
        )
    })

    it('rejects on error_description', () => {
      const api = apiFactory()
      return api.fetchOne({ method: 'POST', uri: 'oauth/token' })
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason.message).equals('The grant type was not specified in the request')
        )
    })

    it('rejects on non-json', () => {
      const apiRoot = 'https://httpbin.org/html'
      const api = apiFactory({ apiRoot })
      return api.fetchOne()
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason).an('Error')
        )
    })

    it('skips json parsing', () => {
      const apiRoot = 'https://httpbin.org/html'
      const api = apiFactory({ apiRoot })
      return api.fetchOne({ parseJson: false })
        .then(response => expect(response.text()).does.not.equal(''))
    })

    describe('shortcut', () => {
      const testShortcut = (apiMethod, expectedJsonMethod) => {
        const apiRoot = 'https://httpbin.org/anything'
        const uri = `uri${Math.random()}`
        const api = apiFactory({ apiRoot })
        return api[apiMethod](uri)
          .then((json) => {
            expect(json.method).equals(expectedJsonMethod)
            expect(json.url).equals(`${apiRoot}?${uri}`)
          })
      }

      it('deletes', () => testShortcut('del', 'DELETE'))
      it('gets', () => testShortcut('get', 'GET'))
      it('posts', () => testShortcut('post', 'POST'))
      it('puts', () => testShortcut('put', 'PUT'))

      it('posts params', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        const options = { params: { foo: `foo${Math.random()}` } }
        return api.post(options)
          .then((json) => expect(json.args.foo).equals(options.params.foo))
      })

      it('posts form data', async () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        const body = new FormData()
        const foo = `foo${Math.random()}`
        body.append('foo', foo)
        const json = await api.post({ body })
        expect(json.form.foo).equals(foo)
      })

      it('posts json', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        const bodyJson = { foo: `foo${Math.random()}` }
        const options = {
          body: JSON.stringify(bodyJson),
          headers: { 'Content-Type': 'application/json' }
        }
        return api.post(options)
          .then((json) => expect(json.json.foo).equals(bodyJson.foo))
      })

      it('posts raw body', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        const body = 'foo'
        const options = { body }
        return api.post(options)
          .then((json) => expect(json.data).equals(body))
      })
    })

    describe('within fetchMultiple', () => {
      it('skips batch if has body', () => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        return api.fetchMultiple(() => {
          const bodyJson = { foo: `foo${Math.random()}` }
          const options = {
            body: JSON.stringify(bodyJson),
            headers: { 'Content-Type': 'application/json' }
          }
          api.fetchOne(options)
            .then((json) => expect(json.json.foo).equals(bodyJson.foo))
        }).then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason).an('Error')
        )
      })

      it('skips batch if no json parsing', () => {
        const apiRoot = 'https://httpbin.org/html'
        const api = apiFactory({ apiRoot })
        return api.fetchMultiple(() => {
          api.fetchOne({ parseJson: false })
            .then(response => expect(response.text()).does.not.equal(''))
        }).then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason).an('Error')
        )
      })
    })
  })

  describe('fetchMultiple', () => {
    it('does nothing if no fetches', () => {
      const api = apiFactory()
      const fetches = () => { }

      return api.fetchMultiple(fetches)
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason).an('Error')
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
          expect(Object.keys(json.jobs).length).equals(3)
          expect(json._handled).equals(3)
          expect(api.getFetchCount()).equals(1)
        })
    })

    it('sends sub-request headers', () => {
      const apiRoot = 'https://httpbin.org/anything'
      const api = apiFactory({ apiRoot })
      const oneHeaders = { One: `${Math.random()}` }
      const twoHeaders = { Two: `${Math.random()}` }
      const fetches = () => {
        api.fetchOne({ uri: 'one', headers: { ...oneHeaders, 'Content-Type': 'foo' } }).catch(e => e)
        api.fetchOne({ uri: 'two', headers: twoHeaders }).catch(e => e)
      }

      return api.fetchMultiple(fetches)
        .then((json) => {
          const { headers } = json
          expect(headers).contains(oneHeaders)
          expect(headers).contains(twoHeaders)
          expect(headers['Content-Type']).equals('application/json')
        })
    })

    describe('sub-request data', () => {
      const testSubRequestData = (optionsOverwrite, callback) => {
        const apiRoot = 'https://httpbin.org/anything'
        const api = apiFactory({ apiRoot })
        const method = `METHOD${Math.random()}`
        const uri = `uri${Math.random()}`
        const params = { foo: `foo${Math.random()}` }
        const options = { method, uri, params, ...optionsOverwrite }
        const fetches = () => api.fetchOne(options).catch(e => e)
        return api.fetchMultiple(fetches)
          .then((json) => callback(json.json[0], { method, uri, params }))
      }

      it('sends method, params, uri', () => {
        return testSubRequestData({}, (received, sent) => {
          expect(received.id).a('string')
          expect(received.method).equals(sent.method)
          expect(received.uri).equals(sent.uri)
          expect(received.params).deep.equals(sent.params)
          expect(Object.keys(received).length).equals(4)
        })
      })

      it('skips method GET', () => testSubRequestData({ method: 'GET' }, (received) => {
        expect(received.method).an('undefined')
        expect(Object.keys(received).length).equals(3)
      }))

      it('sends \'index\' as uri', () => testSubRequestData({ uri: '' }, (received) => {
        expect(received.uri).equals('index')
        expect(Object.keys(received).length).equals(4)
      }))

      it('skips params empty', () => testSubRequestData({ params: {} }, (received) => {
        expect(received.params).an('undefined')
        expect(Object.keys(received).length).equals(3)
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
        expect(Object.keys(json.jobs).length).equals(2)
        expect(json._handled).equals(3)
      }))

      return Promise.all(promises)
        .then(() => {
          expect(posts1).equals(2, 'posts1 twice')
          expect(posts2).equals(1, 'posts2 once')
          expect(api.getFetchCount()).equals(1)
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
      const fetches3 = () => {
        api.fetchOne('posts/6').catch(e => e)
      }
      let checks = 0

      return api.fetchMultiple(() => {
        fetches1()
        api.fetchMultiple(fetches2)
          .then((json) => {
            expect(Object.keys(json.jobs)).contains(md5('GET posts/3?'))
            expect(Object.keys(json.jobs)).contains(md5('GET posts/4?'))
            expect(Object.keys(json.jobs)).contains(md5('GET posts/5?'))
            checks += 3
            expect(api.getFetchCount()).equals(1)
          })
        fetches3()
      }).then((json) => {
        expect(Object.keys(json.jobs)).contains(md5('GET posts/1?'))
        expect(Object.keys(json.jobs)).contains(md5('GET posts/2?'))
        expect(Object.keys(json.jobs)).contains(md5('GET posts/6?'))
        checks += 3
        expect(api.getFetchCount()).equals(1)
      }).then(() => expect(checks).equals(6))
    })

    it('does not trigger handlers', () => {
      const api = apiFactory()

      const fetches = () => {
        api.fetchOne('posts/1').catch(e => e)
        api.fetchOne('posts/2').catch(e => e)
        api.fetchOne('posts/3').catch(e => e)
      }

      return api.fetchMultiple(fetches, { triggerHandlers: false })
        .then((json) => {
          expect(Object.keys(json.jobs).length).equals(3)
          expect(json._handled).equals(0)
          expect(api.getFetchCount()).equals(1)
        })
    })

    it('rejects sub-requests on non-json', () => {
      const apiRoot = 'https://httpbin.org/html'
      const api = apiFactory({ apiRoot })

      const promises = []
      let rejected = 0
      const fetches = () => {
        promises.push(api.fetchOne('foo')
          .then(
            () => Promise.reject(new Error('Unexpected success?!')),
            () => (rejected++)
          )
        )
        promises.push(api.fetchOne('bar')
          .then(
            () => Promise.reject(new Error('Unexpected success?!')),
            () => (rejected++)
          )
        )
      }

      promises.push(api.fetchMultiple(fetches)
        .then(
          () => Promise.reject(new Error('Unexpected success?!')),
          (reason) => expect(reason).an('Error')
        )
      )

      return Promise.all(promises)
        .then(() => expect(rejected).equals(2))
    })
  })

  describe('fetchMultiple internal', () => {
    let mockedBatch
    let mockedFetchOne
    let mockedFetchMultiple
    let mockedResponse

    beforeEach(() => {
      const mockedFetchJson = () => new Promise((resolve) => setTimeout(() => resolve(mockedResponse), 10))
      const mockedInternalApi = { log: () => { } }
      mockedBatch = fetchBatchFactory()
      mockedFetchMultiple = fetchMultipleInit(mockedFetchJson, mockedBatch, mockedInternalApi)
      mockedFetchOne = fetchOneInit(mockedFetchJson, mockedBatch, mockedInternalApi)
    })

    it('handles unknown job in response', () => {
      mockedResponse = { jobs: { foo: 'bar' } }
      const catched = []

      return mockedFetchMultiple(() => mockedFetchOne('index').catch(reason => (catched.push(reason))))
        .then((json) => {
          expect(json._handled).equals(1)
          expect(catched.length).equals(1)
          expect(catched[0].message).equals(errors.FETCH_MULTIPLE.JOB_NOT_FOUND)
        })
    })

    it('handles uniqueId clash', () => {
      const uniqueId = `uniqueId${Math.random()}`
      const job = { _job_result: 'ok', foo: Math.random() }
      mockedResponse = { jobs: { [uniqueId]: job } }
      const jsons = []
      const catched = []

      return mockedFetchMultiple(() => {
        mockedFetchOne('one').then((json) => jsons.push(json))
        mockedFetchOne('two').catch((reason) => catched.push(reason))

        const mockedReqs = mockedBatch.getCurrentReqs()
        mockedReqs[0].uniqueId = uniqueId
        mockedReqs[1].uniqueId = uniqueId
      }).then((json) => {
        expect(json._handled).equals(2)
        expect(jsons.length).equals(1)
        expect(jsons[0].foo).equals(job.foo)
        expect(catched.length).equals(1)
        expect(catched[0].message).equals(errors.FETCH_MULTIPLE.MISMATCHED)
      })
    })

    it('handles non-string _job_result', () => {
      const uri = `uri${Math.random()}`
      const job = { _job_result: false, foo: Math.random() }
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = { jobs: { [uniqueId]: job } }
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(reason => catched.push(reason)))
        .then((json) => {
          expect(json._handled).equals(1)
          expect(catched.length).equals(1)
          expect(catched[0].message).equals(errors.FETCH_MULTIPLE.JOB_RESULT_NOT_FOUND)
        })
    })

    it('handles _job_result=message', () => {
      const uri = `uri${Math.random()}`
      const job = { _job_result: 'message', _job_message: `job message ${Math.random()}` }
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = { jobs: { [uniqueId]: job } }
      return mockedFetchMultiple(
        () => mockedFetchOne(uri)
          .then(one => expect(one).equals(job))
      )
    })

    it('handles _job_error', () => {
      const uri = `uri${Math.random()}`
      const job = { _job_result: 'error', _job_error: `job error ${Math.random()}` }
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = { jobs: { [uniqueId]: job } }
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(reason => catched.push(reason)))
        .then((json) => {
          expect(json._handled).equals(1)
          expect(catched.length).equals(1)
          expect(catched[0].message).equals(job._job_error)
        })
    })

    it('handles unknown error', () => {
      const uri = `uri${Math.random()}`
      const job = { _job_result: 'foo', bar: Math.random() }
      const uniqueId = md5(`GET ${uri}?`)
      mockedResponse = { jobs: { [uniqueId]: job } }
      const catched = []
      return mockedFetchMultiple(() => mockedFetchOne(uri).catch(reason => catched.push(reason)))
        .then((json) => {
          expect(json._handled).equals(1)
          expect(catched.length).equals(1)
          expect(catched[0]).equals(job)
        })
    })
  })
})
