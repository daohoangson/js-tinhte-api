import React from 'react'
import { crypt } from 'tinhte-api'

import { apiFactory } from '..'

describe('fetchApiDataForProvider', () => {
  it('returns jobs', async () => {
    const api = apiFactory()
    const Child = () => 'child'
    Child.apiFetches = { index: { uri: 'index' } }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C />)

    const { jobs } = await api.fetchApiDataForProvider(<P />)
    const uniqueId = crypt.hashMd5('GET index?')
    expect(Object.keys(jobs)).toContain(uniqueId)
  })

  it('returns jobs with a function in apiFetches', async () => {
    const api = apiFactory()
    const Child = () => 'child'
    Child.apiFetches = { index: (_, { foo }) => ({ uri: 'index?foo=' + foo }) }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C foo='bar' />)

    const { jobs } = await api.fetchApiDataForProvider(<P />)
    const uniqueId = crypt.hashMd5('GET index?foo=bar')
    expect(Object.keys(jobs)).toContain(uniqueId)
  })

  it('returns jobs with nested api consumers', async () => {
    const api = apiFactory()
    const Grandchild = () => 'grandchild'
    Grandchild.apiFetches = { grandchild: { uri: 'grandchild' } }
    const Gc = api.ConsumerHoc(Grandchild)
    const Child = () => <Gc />
    Child.apiFetches = { child: { uri: 'child' } }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C />)

    const { jobs } = await api.fetchApiDataForProvider(<P />)
    expect(Object.keys(jobs)).toContain(crypt.hashMd5('GET child?'))
    expect(Object.keys(jobs)).toContain(crypt.hashMd5('GET grandchild?'))
  })

  it('returns jobs within context', async () => {
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

    const { jobs } = await api.fetchApiDataForProvider(<ContextP />)
    const uniqueId = crypt.hashMd5('GET bar?')
    expect(Object.keys(jobs)).toContain(uniqueId)
  })

  it('handles no children', async () => {
    const api = apiFactory()
    const P = api.ProviderHoc(() => 'foo')
    const { jobs } = await api.fetchApiDataForProvider(<P />)
    expect(Object.keys(jobs)).toHaveLength(0)
  })
})
