import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { apiFactory } from '..'

describe('hoc', () => {
  describe('ApiProvider', () => {
    it('swallows our props', () => {
      const api = apiFactory()
      const apiConfig = {}
      const apiData = {}
      const prop = 'foo'
      const P = api.ProviderHoc((props) => <div data-testid='P'>{JSON.stringify(props)}</div>)

      render(<P prop={prop} apiConfig={apiConfig} apiData={apiData} />)
      expect(screen.getByTestId('P')).toHaveTextContent(JSON.stringify({ prop }))
    })

    describe('apiData prop', () => {
      const testApiData = (apiData, callback) => {
        const api = apiFactory()
        const P = api.ProviderHoc(() => <div data-testid='P'>ok</div>)
        render(<P apiData={apiData} />)
        callback(api)
      }

      it('accepts non-object', () => {
        const apiData = 'bar'
        testApiData(apiData, () => {
          expect(screen.getByTestId('P')).toHaveTextContent('ok')
        })
      })

      it('accepts empty object', () => {
        const apiData = {}
        testApiData(apiData, () => {
          expect(screen.getByTestId('P')).toHaveTextContent('ok')
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
            render(<P apiData={apiData} />)
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

    it('renders', async () => {
      const api = apiFactory()

      const Child = ({ test1a, test1b, test1c }) => (
        <div data-testid='Child'>
          <div data-testid='test1a'>{test1a ? 'ok' : 'not'}</div>
          <div data-testid='test1b'>{test1b === 'test1b' ? 'ok' : 'not'}</div>
          <div data-testid='test1c'>{test1c === 'test1c' ? 'ok' : 'not'}</div>
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
        <div data-testid='Child2'>
          <div data-testid='test2a'>{test2a ? 'ok' : 'not'}</div>
          <div data-testid='test2b'>{test2b ? 'ok' : 'not'}</div>
        </div>
      )
      Child2.apiFetches = {
        test2a: { uri: 'index' },
        test2b: { uri: 'index', params: { for: 'test2b' } },
        noop2: () => null
      }
      const C2 = api2.ConsumerHoc(Child2)
      const P2 = api2.ProviderHoc(() => <C2 />)

      expect(api.getFetchCount()).equals(0)
      expect(api2.getFetchCount()).equals(0)
      const apiData = await api.fetchApiDataForProvider(<P />)
      expect(api.getFetchCount()).equals(1)
      expect(api2.getFetchCount()).equals(0)

      render(<P apiData={apiData} />)

      expect(screen.getByTestId('test1a')).toHaveTextContent('ok')
      expect(screen.getByTestId('test1b')).toHaveTextContent('ok')
      expect(screen.getByTestId('test1c')).toHaveTextContent('ok')
      expect(api.getFetchCount()).equals(1)
      expect(api2.getFetchCount()).equals(0)

      const node2 = document.createElement('div')
      render(<P2 apiData={apiData} />, node2)

      await waitFor(() => expect(screen.getByTestId('test2a')).toHaveTextContent('ok'))
      await waitFor(() => expect(screen.getByTestId('test2b')).toHaveTextContent('ok'))
      expect(api.getFetchCount()).equals(1)
      expect(api2.getFetchCount()).equals(1)
    })
  })
})
