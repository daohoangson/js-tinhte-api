import expect from 'expect'
import React from 'react'
import { crypt } from 'tinhte-api'

import { apiFactory } from 'src/'

describe('fetchApiDataForProvider', () => {
  it('returns jobs', () => {
    const api = apiFactory()
    const Child = () => 'child'
    Child.apiFetches = { index: { uri: 'index' } }
    const C = api.ConsumerHoc(Child)
    const P = api.ProviderHoc(() => <C />)

    return api.fetchApiDataForProvider(<P />)
      .then((apiData) => {
        const uniqueId = crypt.hashMd5('GET index?')
        expect(Object.keys(apiData)).toContain(uniqueId)
      })
  })

  it('handles no children', () => {
    const api = apiFactory()
    const P = api.ProviderHoc(() => 'foo')
    return api.fetchApiDataForProvider(<P />)
      .then((apiData) => {
        expect(Object.keys(apiData).length).toBe(0)
      })
  })
})
