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

    it('displays an iframe', (done) => {
      const api = apiFactory({
        callbackUrl: 'callback url',
        clientId: 'client ID',
        scope: 'scope1 scope2'
      })

      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        expect(node.innerHTML).toContain('<iframe')
        expect(node.innerHTML).toContain('src=""')

        setTimeout(() => {
          expect(node.innerHTML).toContain(api.getApiRoot())
          expect(node.innerHTML).toContain(encodeURIComponent(api.getCallbackUrl()))
          expect(node.innerHTML).toContain(encodeURIComponent(api.getClientId()))
          expect(node.innerHTML).toContain(encodeURIComponent(api.getScope()))
          done()
        }, 10)
      })
    })

    it('sets auth', (done) => {
      const api = apiFactory()
      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)
      const auth = {
        access_token: 'access token',
        user_id: Math.random(),
        state: api.getUniqueId()
      }

      render(<ApiProvider />, node, () => {
        window.postMessage({auth}, window.location.origin)

        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          done()
        }, 10)
      })
    })
  })
})
