import expect from 'expect'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'

import { apiFactory } from 'src/'

describe('components', () => {
  describe('Loader', () => {
    let node

    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('does not render without clientId', () => {
      const api = apiFactory({
        callbackUrl: 'callback url'
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.children.length).toEqual(1)
      })
    })

    it('does not render without callbackUrl', () => {
      const api = apiFactory({
        clientId: 'clientId'
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.children.length).toEqual(1)
      })
    })

    it('displays an iframe', () => {
      const callbackUrl = 'callback url'
      const clientId = 'clientId'
      const api = apiFactory({
        callbackUrl,
        clientId,
        delayMs: 0
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.innerHTML).toContain('<iframe')
        expect(node.innerHTML).toContain(`client_id=${clientId}`)
        expect(node.innerHTML).toContain('redirect_uri=' + encodeURIComponent(callbackUrl))
        expect(node.innerHTML).toContain('scope=read')
      })
    })

    it('accepts apiRoot', () => {
      const apiRoot = 'http://api.domain.com'
      const api = apiFactory({
        apiRoot,
        callbackUrl: 'callback url',
        clientId: 'clientId',
        delayMs: 0
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.innerHTML).toContain(apiRoot)
      })
    })

    it('accepts scope', () => {
      const scope = 'read post'
      const api = apiFactory({
        callbackUrl: 'callback url',
        clientId: 'clientId',
        scope,
        delayMs: 0
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.innerHTML).toContain('scope=' + encodeURIComponent(scope))
      })
    })
  })
})
