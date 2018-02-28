import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import reactTreeWalker from 'react-tree-walker'

import { apiFactory } from 'src/'

describe('api', () => {
  describe('generateOneTimeToken', () => {
    it('throws error if not debugging', () => {
      const api = apiFactory()

      let e
      try {
        api.generateOneTimeToken()
      } catch (something) {
        e = something
      }

      expect(e).toBeAn(Error)
    })

    it('returns token', () => {
      const clientId = 'ci'
      const clientSecret = 'cs'
      const userId = 123
      const api = apiFactory({
        auth: {user_id: userId},
        clientId,
        debug: true
      })
      const regEx = new RegExp(`^${userId},\\d+,\\w{32},${clientId}`)

      expect(api.generateOneTimeToken(clientSecret)).toMatch(regEx)
    })

    it('accepts ttl', () => {
      const api = apiFactory({debug: true})
      const ott = api.generateOneTimeToken('cs', 0)

      const m = ott.match(/^0,(\d+),/)
      const timestamp = parseInt(m[1])
      expect(timestamp).toBe(Math.floor(new Date().getTime() / 1000))
    })

    it('accepts exact date', () => {
      const clientId = 'ci'
      const api = apiFactory({
        clientId,
        debug: true
      })
      const timestamp = 123456
      const date = new Date(timestamp * 1000)

      expect(api.generateOneTimeToken('cs', date)).toBe(`0,${timestamp},54aeb4733955fe782fd69b1b2d30235d,${clientId}`)
    })
  })

  describe('getAccessToken', () => {
    it('returns default empty string', () => {
      const api = apiFactory()
      expect(api.getAccessToken()).toBe('')
    })
  })

  describe('getCookieName', () => {
    it('returns default cookie prefix', () => {
      const clientId = 'client ID'
      const api = apiFactory({clientId})
      expect(api.getCookieName()).toMatch(/^auth_/)
    })

    it('returns empty string without client ID', () => {
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({cookiePrefix})
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string without cookie prefix', () => {
      const clientId = 'client ID'
      const cookiePrefix = ''
      const api = apiFactory({clientId, cookiePrefix})
      expect(api.getCookieName()).toBe('')
    })

    it('returns empty string with unsafe client ID', () => {
      const clientId = '#'
      const cookiePrefix = 'cookie prefix'
      const api = apiFactory({clientId, cookiePrefix})
      expect(api.getCookieName()).toBe('')
    })
  })

  describe('getUserId', () => {
    it('returns default zero', () => {
      const api = apiFactory()
      expect(api.getUserId()).toBe(0)
    })
  })

  describe('onAuthenticated', () => {
    it('accepts non-func', () => {
      const api = apiFactory()
      const cancel = api.onAuthenticated('foo')

      // test cancel() right here to avoid duplicated effort
      const canceled = cancel()
      expect(canceled).toBe(false)
    })

    it('executes callback if already authenticated', () => {
      const api = apiFactory({auth: {}})
      let executed = false
      const cancel = api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(true)

      // test cancel() right here to avoid duplicated effort
      const canceled = cancel()
      expect(canceled).toBe(false)
    })

    it('delays callback if not authenticated', (done) => {
      const debug = true
      const api = apiFactory({debug})
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(false)

      api.setAuth()

      setTimeout(() => {
        expect(executed).toBe(true)
        done()
      }, 10)
    })

    describe('cancel()', () => {
      it('prevents callback', (done) => {
        const api = apiFactory({debug: true})
        let executed = false
        const cancel = api.onAuthenticated(() => { executed = true })

        const canceled = cancel()
        expect(canceled).toBe(true)

        api.setAuth()

        setTimeout(() => {
          expect(executed).toBe(false)
          done()
        }, 10)
      })

      it('works once', () => {
        const api = apiFactory()
        const cancel = api.onAuthenticated(() => {})

        const canceled1 = cancel()
        expect(canceled1).toBe(true)

        const canceled2 = cancel()
        expect(canceled2).toBe(false)
      })
    })
  })

  describe('onProviderMounted', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('executes callback', (done) => {
      const api = apiFactory()
      const Parent = ({ children }) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      let executedCount = 0
      const Child = class extends React.Component {
        componentWillMount () {
          api.onProviderMounted(() => (executedCount++))
        }

        render () {
          return <div>foo</div>
        }
      }

      const App = () => <ApiProvider><Child /></ApiProvider>

      const test = (expectedExecutedCount, next) => {
        const testNode = document.createElement('div')

        render(<App />, testNode, () => {
          setTimeout(() => {
            expect(executedCount).toBe(expectedExecutedCount)
            unmountComponentAtNode(testNode)

            next()
          }, 10)
        })
      }

      // run the test twice
      test(1, () => test(2, done))
    })

    it('delays callback', () => {
      const api = apiFactory()
      let executed = false
      api.onProviderMounted(() => {
        executed = true
      })
      expect(executed).toBe(false)
    })

    it('merge batch with onAuthenticated', (done) => {
      const clientId = 'client ID'
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({clientId, cookiePrefix})

      const Parent = ({ children }) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      const promises = []
      const onProviderMounted = class extends React.Component {
        componentWillMount () {
          const { api } = this.props
          api.onProviderMounted(() => {
            promises.push(api.fetchOne('posts/1').catch(e => e))
          })
        }

        render () {
          return <div>foo</div>
        }
      }
      const ApiConsumer1 = api.ConsumerHoc(onProviderMounted)

      const onAuthenticated = class extends React.Component {
        componentWillMount () {
          const { api } = this.props
          api.onAuthenticated(() => {
            promises.push(api.fetchOne('posts/2').catch(e => e))
          })
        }

        render () {
          return <div>bar</div>
        }
      }
      const ApiConsumer2 = api.ConsumerHoc(onAuthenticated)

      const auth = {
        access_token: 'access token',
        user_id: Math.random()
      }
      document.cookie = `${api.getCookieName()}=${JSON.stringify(auth)}`

      const App = () => (
        <ApiProvider>
          <ApiConsumer1 />
          <ApiConsumer2 />
        </ApiProvider>
      )

      render(<App />, node, () => {
        setTimeout(() => {
          expect(promises.length).toBe(2)

          Promise.all(promises)
            .then(() => {
              expect(api.getFetchCount()).toBe(1)
              done()
            })
        }, 10)
      })
    })
  })

  describe('preFetchProviderMounted', () => {
    it('fetches', () => {
      const api = apiFactory()
      const Parent = ({ children }) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      const Child = class extends React.Component {
        componentWillMount () {
          api.onProviderMounted(() => api.fetchOne(this.props.uri))
        }

        render () {
          return <div>foo</div>
        }
      }

      const App = () => (
        <ApiProvider>
          <Child uri='posts/1' />
          <Child uri='posts/2' />
          <Child uri='posts/3' />
        </ApiProvider>
      )

      return reactTreeWalker(<App />, () => true, {}, {componentWillUnmount: true})
        .then(() => api.preFetchProviderMounted())
        .then((json) => {
          expect(Object.keys(json.jobs).length).toBe(3)
          expect(json._handled).toBe(0)
        })
    })
  })

  describe('setAuth', () => {
    it('throws error if not debugging', () => {
      const api = apiFactory()

      let e
      try {
        api.setAuth()
      } catch (something) {
        e = something
      }

      expect(e).toBeAn(Error)
    })

    it('returns callback count', () => {
      const api = apiFactory({debug: true})
      api.onAuthenticated(() => {})
      return api.setAuth()
        .then((callbackCount) => expect(callbackCount).toBe(1))
    })

    it('accepts non-object', () => {
      // see onAuthenticated tests
    })

    it('accepts invalid state', () => {
      const accessToken = 'access token'
      const api = apiFactory({debug: true})
      const auth = {
        access_token: accessToken,
        state: ''
      }
      return api.setAuth(auth)
        .then(() => expect(api.getAccessToken()).toBe(''))
    })

    it('updates access token', () => {
      const accessToken = 'access token'
      const api = apiFactory({debug: true})
      const auth = {
        access_token: accessToken,
        state: api.getUniqueId()
      }
      return api.setAuth(auth)
        .then(() => expect(api.getAccessToken()).toBe(accessToken))
    })
  })

  describe('setOneTimeToken', () => {
    it('accepts non-string', () => {
      const api = apiFactory()
      expect(api.setOneTimeToken(0)).toBe(false)
    })

    it('accepts string', () => {
      const api = apiFactory()
      const ott = `${Math.random()}`
      expect(api.setOneTimeToken(ott)).toBe(true)
      expect(api.getOtt()).toBe(ott)
    })
  })
})
