import { expect } from '@esm-bundle/chai'
import React from 'react'
import ReactDom from 'react-dom'

import { apiFactory, apiHoc } from '..'

const { render, unmountComponentAtNode } = ReactDom

describe('hoc', () => {
  describe('ApiConsumer', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('populates api', (done) => {
      const userId = Math.random()
      const api = apiFactory({ auth: { userId: userId } })

      const Child = ({ api }) => <span className='userId'>{api ? api.getUserId() : 'not'}</span>
      const C = apiHoc.ApiConsumer(Child)
      const P = api.ProviderHoc(() => <C />)

      render(<P />, node, () => {
        setTimeout(() => {
          expect(node.innerHTML).contains(`<span class="userId">${userId}</span>`)
          done()
        }, 10)
      })
    })

    it('does not throw error if not in ApiProvider tree', () => {
      const Child = ({ api }) => <div className='Child'>{api ? 'not' : 'ok'}</div>
      const C = apiHoc.ApiConsumer(Child)

      render(<C />, node, () => {
        expect(node.innerHTML).contains('<div class="Child">ok</div>')
      })
    })

    describe('apiFetchesWithAuth', function () {
      it('accepts non-object', () => {
        const api = apiFactory()
        const Child = () => <div className='Child'>ok</div>
        Child.apiFetchesWithAuth = 'bar'
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        render(<P />, node, () => {
          expect(node.innerHTML).contains('<div class="Child">ok</div>')
        })
      })

      it('executes if already authenticated', () => {
        const api = apiFactory({ auth: {} })
        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />, node)
        })
      })

      it('executes after new auth is available', () => {
        const debug = true
        const api = apiFactory({ debug })
        const internalApi = api.getInternalApi()

        let successCount = 0
        const success = () => {
          successCount++
          expect(successCount).equals(1)
        }

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index', success } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />, node, () => internalApi.setAuth())
        })
      })

      it('cancels when unmount', () => {
        const api = apiFactory()

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        const testNode = document.createElement('div')
        render(<P />, testNode, () => {
          setTimeout(() => {
            const unmounted = unmountComponentAtNode(testNode)
            expect(unmounted).equals(true)
          }, 10)
        })
      })
    })

    describe('apiFetches', function () {
      it('accepts function as fetch', () => {
        const api = apiFactory()
        const foo = `foo${Math.random()}`

        const Child = ({ index }) => <div className='index'>{index && index.links ? 'ok' : 'not'}</div>
        Child.apiFetches = {
          index: (api, props) => {
            expect(api).an('object')
            expect(props.foo).equals(foo)
            return { uri: 'index' }
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const check = () => {
            expect(node.innerHTML).contains('<div class="index">ok</div>')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} foo={foo} />)
          render(<P />, node)
        })
      })

      describe('does no fetch', () => {
        const testDoesNoFetch = (fetches, props = {}, expectedOutput = 'not') => {
          const api = apiFactory()
          const Parent = ({ children }) => <div>{children}</div>
          const P = api.ProviderHoc(Parent)

          const Child = ({ index }) => <div className='index'>{index || 'not'}</div>
          Child.apiFetches = fetches
          const C = apiHoc.ApiConsumer(Child)

          return new Promise((resolve) => {
            const check = () => {
              expect(node.innerHTML).contains(`<div class="index">${expectedOutput}</div>`)
              expect(api.getFetchCount()).equals(0)
              resolve()
            }

            render(<P><C {...props} onFetched={check} /></P>, node)
          })
        }

        it('with empty object', () => {
          return testDoesNoFetch({})
        })

        it('with non-object', () => {
          return testDoesNoFetch({ index: 'foo' })
        })

        it('with function returning null', () => {
          return testDoesNoFetch({ index: () => null })
        })

        it('with existing prop', () => {
          const random = Math.random()
          return testDoesNoFetch({ index: { uri: 'foo' } }, { index: random }, random)
        })

        it('with fetch.body', () => {
          return testDoesNoFetch({ index: { uri: 'foo', body: 'bar' } })
        })

        it('with fetch.parseJson', () => {
          return testDoesNoFetch({ index: { uri: 'foo', parseJson: false } })
        })
      })

      it('returns empty object on error', () => {
        const api = apiFactory()

        const Child = ({ post1 }) => (
          <div className='post1'>
            {
              post1 &&
              Object.keys(post1).length === 0 &&
              'ok'
            }
          </div>
        )
        Child.apiFetches = { post1: { uri: 'posts/1' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const check = () => {
            expect(node.innerHTML).contains('<div class="post1">ok</div>')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} />)
          render(<P />, node)
        })
      })

      it('executes onFetched', () => {
        const api = apiFactory()

        const Child = () => 'foo'
        Child.apiFetches = { index: { uri: 'index' } }
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
        Child.apiFetches = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          render(<C onFetched={resolve} />, node)
        })
      })

      it('merge batch with apiFetchesWithAuth', () => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookiePrefix = `cookie_prefix_${Math.random()}_`.replace(/[^a-z0-9]/gi, '')
        const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
        const api = apiFactory({ clientId, cookiePrefix })

        const auth = {
          access_token: 'access token',
          user_id: Math.random()
        }
        expect(document.cookie).does.not.contain(cookiePrefix)
        document.cookie = `${cookiePrefix}session=${cookieSession}`
        document.cookie = `${clientId}__${cookieSession}=${JSON.stringify(auth)}`

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { post1: { uri: 'posts/1' } }
        Child.apiFetches = { post2: { uri: 'posts/2' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const resolve1 = resolve
          return new Promise((resolve) => {
            const resolve2 = resolve
            const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve1} onFetched={resolve2} />)
            render(<P />, node)
          })
        }).then(() => expect(api.getFetchCount()).equals(1))
      })
    })
  })
})
