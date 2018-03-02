import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory } from 'src/'

describe('hoc', () => {
  describe('ApiProvider', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    describe('apiConfig', () => {
      const test = (apiConfig, callback) => {
        const api = apiFactory()
        const ApiProvider = api.ProviderHoc(() => <div>foo</div>)
        render(<ApiProvider apiConfig={apiConfig} />, node, () => callback(api))
      }

      it('accepts non-object', () => {
        const apiConfig = 'bar'
        test(apiConfig, () => {
          expect(node.innerHTML).toContain('foo')
        })
      })

      it('accepts apiRoot', () => {
        const apiRoot = 'api root'
        const apiConfig = {apiRoot}
        test(apiConfig, (api) => expect(api.getApiRoot()).toBe(apiRoot))
      })

      it('accepts auth.access_token', () => {
        const accessToken = 'access token'
        const apiConfig = {auth: {access_token: accessToken}}
        test(apiConfig, (api) => expect(api.getAccessToken()).toBe(accessToken))
      })

      it('accepts auth.user_id', () => {
        const userId = 1
        const apiConfig = {auth: {user_id: userId}}
        test(apiConfig, (api) => expect(api.getUserId()).toBe(userId))
      })

      it('accepts callbackUrl', () => {
        const callbackUrl = 'callback url'
        const apiConfig = {callbackUrl}
        test(apiConfig, (api) => expect(api.getCallbackUrl()).toBe(callbackUrl))
      })

      it('accepts clientId', () => {
        const clientId = 'client ID'
        const apiConfig = {clientId}
        test(apiConfig, (api) => expect(api.getClientId()).toBe(clientId))
      })

      it('accepts cookiePrefix', () => {
        const cookiePrefix = 'cookie prefix'
        const clientId = 'client ID'
        const apiConfig = {clientId, cookiePrefix}
        const regEx = new RegExp('^' + cookiePrefix)
        test(apiConfig, (api) => expect(api.getCookieName()).toMatch(regEx))
      })

      it('accepts debug', () => {
        const debug = true
        const apiConfig = {debug}
        test(apiConfig, (api) => expect(api.getDebug()).toBe(debug))
      })

      it('accepts ott', () => {
        const ott = 'ott'
        const apiConfig = {ott}
        test(apiConfig, (api) => expect(api.getOtt()).toBe(ott))
      })

      it('accepts scope', () => {
        const scope = 'scope1 scope2'
        const apiConfig = {scope}
        test(apiConfig, (api) => expect(api.getScope()).toBe(scope))
      })
    })

    describe('apiData', () => {
      const test = (apiData, callback) => {
        const api = apiFactory()
        const ApiProvider = api.ProviderHoc(() => <div>foo</div>)
        render(<ApiProvider apiData={apiData} />, node, () => callback(api))
      }

      it('accepts non-object', () => {
        const apiData = 'foo'
        test(apiData, () => {
          expect(node.innerHTML).toContain('<div>foo</div')
        })
      })

      it('accepts empty object', () => {
        const apiData = {}
        test(apiData, () => {
          expect(node.innerHTML).toContain('<div>foo</div')
        })
      })

      it('renders from apiData', (done) => {
        const api = apiFactory()

        const Child = ({ test1 }) => <div className='Child'>{test1 ? 'ok' : 'not'}</div>
        Child.apiFetches = {
          test1: {
            uri: 'index'
          }
        }
        const C = api.ConsumerHoc(Child)
        const Parent = () => <div className='Parent'><C /></div>
        const P = api.ProviderHoc(Parent)

        const api2 = apiFactory()
        const Child2 = ({ test2a, test2b }) => (
          <div className='Child2'>
            <div className='test2a'>{test2a ? 'ok' : 'not'}</div>
            <div className='test2b'>{test2b ? 'ok' : 'not'}</div>
          </div>
        )
        Child2.apiFetches = {
          test2a: {
            uri: 'index'
          },
          test2b: {
            uri: 'navigation'
          }
        }
        const C2 = api2.ConsumerHoc(Child2)
        let onC2Fetched = null
        const Parent2 = () => <div className='Parent2'><C2 onFetched={onC2Fetched} /></div>
        const P2 = api2.ProviderHoc(Parent2)

        api.fetchApiDataForProvider(<P />)
          .then((apiData) => {
            expect(api.getFetchCount()).toBe(1)

            // test 1: renders from apiData
            render(<P apiData={apiData} />, node, () => {
              expect(node.innerHTML).toContain('<div class="Child">ok</div>')
              expect(api.getFetchCount()).toBe(1)

              // test 2: fetches for missing data
              const node2 = document.createElement('div')
              render(<P2 apiData={apiData} />, node2)
              onC2Fetched = () => {
                setTimeout(() => {
                  expect(node2.innerHTML).toContain('<div class="test2a">ok</div>')
                  expect(node2.innerHTML).toContain('<div class="test2b">ok</div>')
                  expect(api.getFetchCount()).toBe(1)
                  expect(api2.getFetchCount()).toBe(1)

                  unmountComponentAtNode(node2)
                  done()
                }, 10)
              }
            })
          })
      })
    })
  })
})
