import { render, screen } from '@testing-library/react'
import React from 'react'

import { apiFactory, apiHoc } from '..'

describe('hoc', () => {
  describe('ApiConsumer', () => {
    it('populates api', async () => {
      const userId = Math.random()
      const api = apiFactory({ auth: { userId: userId } })

      const Child = ({ api }) => <span data-testid='userId'>{api ? api.getUserId() : 'not'}</span>
      const C = apiHoc.ApiConsumer(Child)
      const P = api.ProviderHoc(() => <C />)

      render(<P />)
      expect(await screen.findByTestId('userId')).toHaveTextContent(userId.toString())
    })

    it('does not throw error if not in ApiProvider tree', () => {
      const Child = ({ api }) => <div data-testid='child'>{api ? 'not' : 'ok'}</div>
      const C = apiHoc.ApiConsumer(Child)

      render(<C />)
      expect(screen.getByTestId('child')).toHaveTextContent('ok')
    })

    describe('apiFetchesWithAuth', () => {
      it('accepts non-object', () => {
        const api = apiFactory()
        const Child = () => <div data-testid='child'>ok</div>
        Child.apiFetchesWithAuth = 'bar'
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        render(<P />)
        expect(screen.getByTestId('child')).toHaveTextContent('ok')
      })

      it('executes if already authenticated', async () => {
        const api = apiFactory({ auth: {} })
        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />)
        })
      })

      it('executes after new auth is available', async () => {
        const debug = true
        const api = apiFactory({ debug })
        const internalApi = api.getInternalApi()

        let successCount = 0
        const success = () => {
          successCount++
          expect(successCount).toBe(1)
        }

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index', success } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetchedWithAuth={resolve} />)
          render(<P />)
          internalApi.setAuth()
        })
      })

      it('cancels when unmount', () => {
        const api = apiFactory()

        let successCount = 0
        const success = () => (successCount++)

        const Child = () => 'foo'
        Child.apiFetchesWithAuth = { index: { uri: 'index', success } }
        const C = apiHoc.ApiConsumer(Child)
        const P = api.ProviderHoc(() => <C />)

        const { unmount } = render(<P />)
        unmount()
        expect(successCount).toBe(0)
      })
    })

    describe('apiFetches', () => {
      it('accepts function as fetch', async () => {
        const api = apiFactory()
        const foo = `foo${Math.random()}`

        const Child = ({ index }) => <div data-testid='index'>{index && index.links ? 'ok' : 'not'}</div>
        Child.apiFetches = {
          index: (api, props) => {
            expect(api).toBeDefined()
            expect(props.foo).toBe(foo)
            return { uri: 'index' }
          }
        }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          const check = () => {
            expect(screen.getByTestId('index')).toHaveTextContent('ok')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} foo={foo} />)
          render(<P />)
        })
      })

      describe('does no fetch', () => {
        const testDoesNoFetch = (fetches, props = {}, expectedOutput = 'not') => {
          const api = apiFactory()
          const Parent = ({ children }) => <div>{children}</div>
          const P = api.ProviderHoc(Parent)

          const Child = ({ index }) => <div data-testid='index'>{index || 'not'}</div>
          Child.apiFetches = fetches
          const C = apiHoc.ApiConsumer(Child)

          return new Promise((resolve) => {
            const check = () => {
              expect(screen.getByTestId('index')).toHaveTextContent(expectedOutput)
              expect(api.getFetchCount()).toBe(0)
              resolve()
            }

            render(<P><C {...props} onFetched={check} /></P>)
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

      it('returns empty object on error', async () => {
        const api = apiFactory()

        const Child = ({ post1 }) => (
          <div data-testid='post1'>
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
            expect(screen.getByTestId('post1')).toHaveTextContent('ok')
            resolve()
          }
          const P = api.ProviderHoc(() => <C onFetched={check} />)
          render(<P />)
        })
      })

      it('executes onFetched', async () => {
        const api = apiFactory()

        const Child = () => 'foo'
        Child.apiFetches = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)

        const test = () => new Promise((resolve) => {
          const P = api.ProviderHoc(() => <C onFetched={resolve} />)
          render(<P />)
        })

        // run the test twice
        await Promise.all([test(), test()])
      })

      it('handles bad context', async () => {
        const Child = () => 'foo'
        Child.apiFetches = { index: { uri: 'index' } }
        const C = apiHoc.ApiConsumer(Child)

        return new Promise((resolve) => {
          render(<C onFetched={resolve} />)
        })
      })

      it('merge batch with apiFetchesWithAuth', async () => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookiePrefix = `cookie_prefix_${Math.random()}_`.replace(/[^a-z0-9]/gi, '')
        const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
        const api = apiFactory({ clientId, cookiePrefix })

        const auth = {
          access_token: 'access token',
          user_id: Math.random()
        }
        expect(document.cookie).not.toContain(cookiePrefix)
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
            render(<P />)
          })
        }).then(() => expect(api.getFetchCount()).toBe(1))
      })
    })
  })
})
