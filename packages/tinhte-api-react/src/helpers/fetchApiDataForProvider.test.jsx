import { expect } from '@esm-bundle/chai'
import React from 'react'
import { crypt } from 'tinhte-api'

import { apiFactory } from '..'

describe('fetchApiDataForProvider', () => {
  it('returns jobs', () => {
    const api = apiFactory()
    const Child = () => 'child'
    Child.apiFetches = { index: { uri: 'index' } }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C />)

    return api.fetchApiDataForProvider(<P />)
      .then(({ jobs }) => {
        const uniqueId = crypt.hashMd5('GET index?')
        expect(Object.keys(jobs)).contains(uniqueId)
      })
  })

  it('returns jobs with a function in apiFetches', () => {
    const api = apiFactory()
    const Child = () => 'child'
    Child.apiFetches = { index: (_, { foo }) => ({ uri: 'index?foo=' + foo }) }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C foo='bar' />)

    return api.fetchApiDataForProvider(<P />)
      .then(({ jobs }) => {
        const uniqueId = crypt.hashMd5('GET index?foo=bar')
        expect(Object.keys(jobs)).contains(uniqueId)
      })
  })

  it('returns jobs with nested api consumers', () => {
    const api = apiFactory()
    const Grandchild = () => 'grandchild'
    Grandchild.apiFetches = { grandchild: { uri: 'grandchild' } }
    const Gc = api.ConsumerHoc(Grandchild)
    const Child = () => <Gc />
    Child.apiFetches = { child: { uri: 'child' } }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C />)

    return api.fetchApiDataForProvider(<P />)
      .then(({ jobs }) => {
        expect(Object.keys(jobs)).contains(crypt.hashMd5('GET child?'))
        expect(Object.keys(jobs)).contains(crypt.hashMd5('GET grandchild?'))
      })
  })

  it('returns jobs within context', () => {
    const createContextHoc = () => {
      const { Provider, Consumer } = React.createContext()
      const subscribe = (Component, mapper) => (props) => (
        <Consumer>
          {(contextProps) => <Component {...props} {...mapper(contextProps)} />}
        </Consumer>
      )

      return { Provider, subscribe }
    }

    const api = apiFactory()
    const context = createContextHoc()
    const Child = () => 'child'
    Child.apiFetches = { index: (_, { uri }) => ({ uri }) }
    const C = api.ConsumerHoc(Child)
    const ContextC = context.subscribe(C, ({ uri2: uri }) => ({ uri }))
    const P = api.ProviderHoc(() => <ContextC />)
    const ContextP = () => <context.Provider value={{ uri1: 'foo', uri2: 'bar' }}><P /></context.Provider>

    return api.fetchApiDataForProvider(<ContextP />).then(({ jobs }) => {
      const uniqueId = crypt.hashMd5('GET bar?')
      expect(Object.keys(jobs)).contains(uniqueId)
    })
  })

  it('handles no children', () => {
    const api = apiFactory()
    const P = api.ProviderHoc(() => 'foo')
    return api.fetchApiDataForProvider(<P />)
      .then(({ jobs }) => {
        expect(Object.keys(jobs).length).equals(0)
      })
  })
})
