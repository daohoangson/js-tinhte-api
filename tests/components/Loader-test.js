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

    it('handles message without auth', (done) => {
      const api = apiFactory()
      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)

      render(<ApiProvider />, node, () => {
        window.postMessage({foo: 'bar'}, window.location.origin)

        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="0"`)
          done()
        }, 10)
      })
    })

    it('sets auth and cookie', (done) => {
      const clientId = 'client ID'
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({clientId, cookiePrefix})
      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)
      const auth = {
        access_token: 'access token',
        expires_in: 3600,
        user_id: Math.random(),
        state: api.getUniqueId()
      }

      expect(document.cookie).toNotContain(cookiePrefix)

      render(<ApiProvider />, node, () => {
        window.postMessage({auth}, window.location.origin)

        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          expect(document.cookie).toContain(cookiePrefix)
          done()
        }, 10)
      })
    })

    it('does not set cookie without expires_in', (done) => {
      const clientId = 'client ID'
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({clientId, cookiePrefix})
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
          expect(document.cookie).toNotContain(cookiePrefix)
          done()
        }, 10)
      })
    })

    it('does not set cookie without client ID', (done) => {
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({cookiePrefix})
      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)
      const auth = {
        access_token: 'access token',
        expires_in: 3600,
        user_id: Math.random(),
        state: api.getUniqueId()
      }

      render(<ApiProvider />, node, () => {
        window.postMessage({auth}, window.location.origin)

        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          expect(document.cookie).toNotContain(cookiePrefix)
          done()
        }, 10)
      })
    })

    it('restores auth from cookie', (done) => {
      const clientId = 'client ID'
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({clientId, cookiePrefix, debug: true})
      const Component = () => <div>foo</div>
      const ApiProvider = api.ProviderHoc(Component)
      const auth = {
        access_token: 'access token',
        user_id: Math.random()
      }

      expect(document.cookie).toNotContain(cookiePrefix)
      document.cookie = `${api.getCookieName()}=${JSON.stringify(auth)}`

      render(<ApiProvider />, node, () => {
        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          done()
        }, 10)
      })
    })
  })
})
