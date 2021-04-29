import { expect } from '@esm-bundle/chai'
import React from 'react'
import ReactDom from 'react-dom'

import { apiFactory } from '..'

const { render, unmountComponentAtNode } = ReactDom

describe('hoc', () => {
  describe('ApiProvider', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('swallows our props', () => {
      const api = apiFactory()
      const apiConfig = {}
      const apiData = {}
      const prop = 'foo'
      const P = api.ProviderHoc((props) => <div className='P'>{JSON.stringify(props)}</div>)
      render(<P prop={prop} apiConfig={apiConfig} apiData={apiData} />, node, () => {
        expect(node.innerHTML).contains('<div class="P">' + JSON.stringify({ prop }) + '</div>')
      })
    })

    describe('apiData prop', () => {
      const testApiData = (apiData, callback) => {
        const api = apiFactory()
        const P = api.ProviderHoc(() => <div className='P'>ok</div>)
        render(<P apiData={apiData} />, node, () => callback(api))
      }

      it('accepts non-object', () => {
        const apiData = 'bar'
        testApiData(apiData, () => {
          expect(node.innerHTML).contains('<div class="P">ok</div')
        })
      })

      it('accepts empty object', () => {
        const apiData = {}
        testApiData(apiData, () => {
          expect(node.innerHTML).contains('<div class="P">ok</div')
        })
      })

      describe('bad data', () => {
        const testBadData = (apiData) => {
          const api = apiFactory()

          const Child = () => 'foo'
          Child.apiFetches = { index: { uri: 'index' } }
          const C = api.ConsumerHoc(Child)

          return new Promise((resolve) => {
            const P = api.ProviderHoc(() => <C onFetched={resolve} />)
            render(<P apiData={apiData} />, node)
          }).then(() => expect(api.getFetchCount()).equals(1))
        }

        it('fetches with non-object job data', () => {
          const apiData = { foo: 'bar' }
          return testBadData(apiData)
        })

        it('fetches with bad job data', () => {
          const apiData = { foo: { _req: 'bar' } }
          return testBadData(apiData)
        })
      })
    })

    it('renders', (done) => {
      const api = apiFactory()

      const Child = ({ test1a, test1b, test1c }) => (
        <div className='Child'>
          <div className='test1a'>{test1a ? 'ok' : 'not'}</div>
          <div className='test1b'>{test1b === 'test1b' ? 'ok' : 'not'}</div>
          <div className='test1c'>{test1c === 'test1c' ? 'ok' : 'not'}</div>
        </div>
      )
      Child.apiFetches = {
        test1a: { uri: 'index' },
        test1b: { uri: 'index', success: () => 'test1b' },
        test1c: () => ({ uri: 'index', success: () => 'test1c' }),
        noop: () => null
      }
      const C = api.ConsumerHoc(Child)
      const ChildWithoutFetch = () => 'foo'
      const ConsumerWithoutFetch = api.ConsumerHoc(ChildWithoutFetch)
      const P = api.ProviderHoc(() => <div><C /><ConsumerWithoutFetch /></div>)

      const api2 = apiFactory()
      const Child2 = ({ test2a, test2b }) => (
        <div className='Child2'>
          <div className='test2a'>{test2a ? 'ok' : 'not'}</div>
          <div className='test2b'>{test2b ? 'ok' : 'not'}</div>
        </div>
      )
      Child2.apiFetches = {
        test2a: { uri: 'index' },
        test2b: { uri: 'index', params: { for: 'test2b' } },
        noop2: () => null
      }
      const C2 = api2.ConsumerHoc(Child2)
      let onC2Fetched = null
      const P2 = api2.ProviderHoc(() => <C2 onFetched={onC2Fetched} />)

      expect(api.getFetchCount()).equals(0)
      expect(api2.getFetchCount()).equals(0)
      api.fetchApiDataForProvider(<P />)
        .then((apiData) => {
          expect(api.getFetchCount()).equals(1)
          expect(api2.getFetchCount()).equals(0)

          // test 1: renders from apiData
          render(<P apiData={apiData} />, node, () => {
            setTimeout(() => {
              expect(node.innerHTML).contains('<div class="test1a">ok</div>')
              expect(node.innerHTML).contains('<div class="test1b">ok</div>')
              expect(node.innerHTML).contains('<div class="test1c">ok</div>')
              expect(api.getFetchCount()).equals(1)
              expect(api2.getFetchCount()).equals(0)

              // test 2: fetches for missing data
              onC2Fetched = () => {
                setTimeout(() => {
                  expect(node2.innerHTML).contains('<div class="test2a">ok</div>')
                  expect(node2.innerHTML).contains('<div class="test2b">ok</div>')
                  expect(api.getFetchCount()).equals(1)
                  expect(api2.getFetchCount()).equals(1)

                  unmountComponentAtNode(node2)
                  done()
                }, 10)
              }

              const node2 = document.createElement('div')
              render(<P2 apiData={apiData} />, node2)
            }, 10)
          })
        })
    })
  })
})
