import { expect } from '@esm-bundle/chai'

import _ from './standardizeReqOptions'

describe('helpers', () => {
  describe('standardizeReqOptions', () => {
    describe('uri', () => {
      it('populates default uri', () => {
        const options = {}
        _(options)
        expect(options.uri).equals('')
      })

      it('keeps path-only uri', () => {
        const uri = 'path'
        const options = { uri }
        _(options)
        expect(options.uri).equals(uri)
      })

      it('trims prefix slashes', () => {
        const options = { uri: '/path' }
        _(options)
        expect(options.uri).equals('path')
      })

      it('sorts query params', () => {
        const options = { uri: 'path?a=1&c=2&b=3' }
        _(options)
        expect(options.uri).equals('path')
        expect(options.paramsAsString).equals('a=1&b=3&c=2')
      })

      it('remove bad ampersands', () => {
        const options = { uri: 'path?foo=1&&&bar=2' }
        _(options)
        expect(options.paramsAsString).equals('bar=2&foo=1')
      })

      it('remove empty value', () => {
        const options = { uri: 'path?empty=&foo=1' }
        _(options)
        expect(options.paramsAsString).equals('foo=1')
      })

      it('remove empty value in array', () => {
        const options = { uri: 'path?foo=1&foo=&bar=2' }
        _(options)
        expect(options.paramsAsString).equals('bar=2&foo=1')
      })

      it('remove empty array', () => {
        const options = { uri: 'path?empty=&empty=&foo=1' }
        _(options)
        expect(options.paramsAsString).equals('foo=1')
      })
    })

    describe('method', () => {
      it('populates default method', () => {
        const options = {}
        _(options)
        expect(options.method).equals('GET')
      })

      it('capitalizes method', () => {
        const options = { method: 'foo' }
        _(options)
        expect(options.method).equals('FOO')
      })
    })
  })
})
