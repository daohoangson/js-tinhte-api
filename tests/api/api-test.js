import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory } from 'src/'

describe('api', () => {
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

    it('delays callback if not authenticated', () => {
      const api = apiFactory({debug: true})
      let executed = false
      api.onAuthenticated(() => { executed = true })
      expect(executed).toBe(false)

      api.setAuth()
      expect(executed).toBe(true)
    })

    describe('cancel()', () => {
      it('prevents callback', () => {
        const api = apiFactory({debug: true})
        let executed = false
        const cancel = api.onAuthenticated(() => { executed = true })

        const canceled = cancel()
        expect(canceled).toBe(true)

        api.setAuth()
        expect(executed).toBe(false)
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

    it('executes callback', () => {
      const api = apiFactory()
      const Parent = ({ children }) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      let executed = false
      const Child = class extends React.Component {
        componentWillMount () {
          this.props.api.onProviderMounted(() => {
            executed = true
          })
        }

        render () {
          return <div>foo</div>
        }
      }
      const ApiConsumer = api.ConsumerHoc(Child)

      const App = () => (
        <ApiProvider>
          <ApiConsumer />
        </ApiProvider>
      )

      render(<App />, node, () => {
        expect(executed).toBe(true)
      })
    })

    it('delays callback', () => {
      const api = apiFactory()
      let executed = false
      api.onProviderMounted(() => {
        executed = true
      })
      expect(executed).toBe(false)
    })
  })

  describe('setAuth', () => {
    it('does nothing if not debugging', () => {
      const api = apiFactory()
      api.onAuthenticated(() => {})
      const callbackCount = api.setAuth()
      expect(callbackCount).toBe(0)
    })

    it('returns callback count', () => {
      const api = apiFactory({debug: true})
      api.onAuthenticated(() => {})
      const callbackCount = api.setAuth()
      expect(callbackCount).toBe(1)
    })

    it('accepts non-object', () => {
      // see onAuthenticated tests
    })

    it('accepts invalid state', () => {
      const accessToken = 'access token'
      const api = apiFactory({debug: true})
      api.setAuth({
        access_token: accessToken,
        state: ''
      })

      expect(api.getAccessToken()).toBe('')
    })

    it('updates access token', () => {
      const accessToken = 'access token'
      const api = apiFactory({debug: true})
      api.setAuth({
        access_token: accessToken,
        state: api.getUniqueId()
      })

      expect(api.getAccessToken()).toBe(accessToken)
    })
  })
})
