import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory, apiHoc } from 'src/'

describe('hoc', () => {
  describe('ApiConsumer', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('populates api', () => {
      const userId = Math.random()
      const api = apiFactory({auth: {user_id: userId}})

      const Parent = ({ children }) => <div>{children}</div>
      const ApiProvider = api.ProviderHoc(Parent)

      const Child = ({api}) => <span className='userId'>{api.getUserId()}</span>
      const ApiConsumer = apiHoc.ApiConsumer(Child)

      const Test = () => (
        <ApiProvider>
          <ApiConsumer />
        </ApiProvider>
      )

      render(<Test />, node, () => {
        expect(node.innerHTML).toContain(`<span class="userId">${userId}</span>`)
      })
    })

    it('does not throw error if not in ApiProvider tree', () => {
      const Parent = ({ children }) => <div>{children}</div>

      const Child = () => <div>foo</div>
      const C = apiHoc.ApiConsumer(Child)

      render(<Parent><C /></Parent>, node, () => {
        expect(node.innerHTML).toContain(`<div>foo</div>`)
      })
    })

    describe('apiFetchesWithAuth', () => {
      it('accepts non-object', () => {
        const api = apiFactory()
        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        Child.apiFetchesWithAuth = 'bar'
        const C = apiHoc.ApiConsumer(Child)

        render(<P><C /></P>, node, () => {
          expect(node.innerHTML).toContain(`<div>foo</div>`)
        })
      })

      it('executes if already authenticated', () => {
        const api = apiFactory({auth: {}})
        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        Child.apiFetchesWithAuth = {
          'index': {
            uri: 'index'
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => render(<P><C onFetchedWithAuth={resolve} /></P>, node))
      })

      it('executes after new auth is available', () => {
        const debug = true
        const api = apiFactory({debug})
        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        let successCount = 0
        Child.apiFetchesWithAuth = {
          'index': {
            uri: 'index',
            success: () => {
              successCount++
              expect(successCount).toBe(1)
            }
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        const onRendered = () => api.setAuth()

        return new Promise((resolve) => render(<P><C onFetchedWithAuth={resolve} /></P>, node, onRendered))
      })

      it('cancels when unmount', () => {
        const api = apiFactory()
        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        Child.apiFetchesWithAuth = {
          'index': {
            uri: 'index'
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        const testNode = document.createElement('div')

        render(<P><C /></P>, testNode, () => {
          const unmounted = unmountComponentAtNode(testNode)
          expect(unmounted).toBe(true)
        })
      })
    })

    describe('apiFetches', () => {
      it('executes callback', () => {
        const api = apiFactory()
        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        Child.apiFetches = {
          'index': {
            uri: 'index'
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        const test = () => new Promise((resolve) => {
          const testNode = document.createElement('div')
          render(<P><C onFetched={resolve} /></P>, testNode, () => unmountComponentAtNode(testNode))
        })

        // run the test twice
        return Promise.all([test(), test()])
      })

      it('merge batch with apiFetchesWithAuth', () => {
        const clientId = 'client ID'
        const cookiePrefix = `auth${Math.random()}_`
        const api = apiFactory({clientId, cookiePrefix})
        const auth = {
          access_token: 'access token',
          user_id: Math.random()
        }
        document.cookie = `${api.getCookieName()}=${JSON.stringify(auth)}`

        const Parent = ({ children }) => <div>{children}</div>
        const P = api.ProviderHoc(Parent)

        const Child = () => <div>foo</div>
        Child.apiFetchesWithAuth = {
          'apiFetchesWithAuth': {
            uri: 'posts/1',
            error: () => {}
          }
        }
        Child.apiFetches = {
          'apiFetches': {
            uri: 'posts/2',
            error: () => {}
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const resolve1 = resolve
          return new Promise((resolve) => {
            const resolve2 = resolve

            const Test = () => (
              <P><C onFetchedWithAuth={resolve1} onFetched={resolve2} /></P>
            )

            render(<Test />, node)
          })
        }).then(() => expect(api.getFetchCount()).toBe(1))
      })
    })
  })
})
