import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory, apiHoc } from 'src/'
import { isObject } from 'src/helpers'

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
      const api = apiFactory({auth: {userId: userId}})

      const Child = ({api}) => <span className='userId'>{api.getUserId()}</span>
      const C = apiHoc.ApiConsumer(Child)
      const P = api.ProviderHoc(() => <C />)

      render(<P />, node, () => {
        expect(node.innerHTML).toContain(`<span class="userId">${userId}</span>`)
      })
    })

    it('does not throw error if not in ApiProvider tree', () => {
      const Child = ({ api }) => <div className='Child'>{api ? 'not' : 'ok'}</div>
      const C = apiHoc.ApiConsumer(Child)

      render(<C />, node, () => {
        expect(node.innerHTML).toContain(`<div class="Child">ok</div>`)
      })
    })

    describe('apiFetchesWithAuth', () => {
      it('accepts non-object', () => {
        const api = apiFactory()
        const Child = () => <div className='Child'>ok</div>
        Child.apiFetchesWithAuth = 'bar'
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        render(<P />, node, () => {
          expect(node.innerHTML).toContain(`<div class="Child">ok</div>`)
        })
      })

      it('executes if already authenticated', () => {
        const api = apiFactory({auth: {}})
        const Child = () => 'foo'
        Child.apiFetchesWithAuth = {index: {uri: 'index'}}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />, node)
        })
      })

      it('executes after new auth is available', () => {
        const debug = true
        const api = apiFactory({debug})

        let successCount = 0
        const success = () => {
          successCount++
          expect(successCount).toBe(1)
        }

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = {index: {uri: 'index', success}}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />, node, () => api.setAuth())
        })
      })

      it('cancels when unmount', () => {
        const api = apiFactory()

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = {index: {uri: 'index'}}
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        const testNode = document.createElement('div')
        render(<P />, testNode, () => {
          const unmounted = unmountComponentAtNode(testNode)
          expect(unmounted).toBe(true)
        })
      })
    })

    describe('apiFetches', () => {
      it('accepts function as fetch', () => {
        const api = apiFactory()

        const Child = ({ index }) => <div className='index'>{index && index.links ? 'ok' : 'not'}</div>
        const func = (api) => {
          expect(api).toBeAn('object')
          return {uri: 'index'}
        }
        Child.apiFetches = {index: func}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const check = () => {
            expect(node.innerHTML).toContain('<div class="index">ok</div>')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} />)
          render(<P />, node)
        })
      })

      describe('does no fetch', () => {
        const testDoesNoFetch = (fetches) => {
          const api = apiFactory()
          const Parent = ({ children }) => <div>{children}</div>
          const P = api.ProviderHoc(Parent)

          const Child = ({ index }) => <div className='index'>{index ? 'ok' : 'not'}</div>
          Child.apiFetches = fetches
          const C = apiHoc.ApiConsumer(Child)

          return new Promise((resolve) => {
            const check = () => {
              expect(node.innerHTML).toContain('<div class="index">not</div>')
              expect(api.getFetchCount()).toBe(0)
              resolve()
            }

            render(<P><C onFetched={check} /></P>, node)
          })
        }

        it('with non-object', () => {
          return testDoesNoFetch({index: 'foo'})
        })

        it('without uri', () => {
          return testDoesNoFetch({index: {}})
        })
      })

      it('returns empty object on error', () => {
        const api = apiFactory()

        const Child = ({ post1 }) => (
          <div className='post1'>
            {
              isObject(post1) &&
              Object.keys(post1).length === 0 &&
              'ok'
            }
          </div>
        )
        Child.apiFetches = {post1: {uri: 'posts/1'}}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const check = () => {
            expect(node.innerHTML).toContain('<div class="post1">ok</div>')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} />)
          render(<P />, node)
        })
      })

      it('executes onFetched', () => {
        const api = apiFactory()

        const Child = () => 'foo'
        Child.apiFetches = {index: {uri: 'index'}}
        const C = apiHoc.ApiConsumer(Child)

        const test = () => new Promise((resolve) => {
          const testNode = document.createElement('div')
          const testDone = () => {
            unmountComponentAtNode(testNode)
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={testDone} />)
          render(<P />, testNode)
        })

        // run the test twice
        return Promise.all([test(), test()])
      })

      it('handles bad context', () => {
        const Child = () => 'foo'
        Child.apiFetches = {index: {uri: 'index'}}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          render(<C onFetched={resolve} />, node)
        })
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

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = {post1: {uri: 'posts/1'}}
        Child.apiFetches = {post2: {uri: 'posts/2'}}
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const resolve1 = resolve
          return new Promise((resolve) => {
            const resolve2 = resolve
            const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve1} onFetched={resolve2} />)
            render(<P />, node)
          })
        }).then(() => expect(api.getFetchCount()).toBe(1))
      })
    })
  })
})
