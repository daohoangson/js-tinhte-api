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

      const P = api.ProviderHoc(() => 'foo')

      render(<P />, node, () => {
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

    it('does not show up with access token already set', () => {
      const api = apiFactory({
        auth: {accessToken: 'access token'},
        callbackUrl: 'callback url',
        clientId: 'client ID',
        scope: 'scope1 scope2'
      })

      const P = api.ProviderHoc(() => 'foo')

      render(<P />, node, () => {
        expect(node.innerHTML).toNotContain('<iframe')
      })
    })

    describe('receives message', () => {
      const testReceiveMessage = (apiConfig, messageFactory, callback) => {
        const api = apiFactory(apiConfig)
        const P = api.ProviderHoc(() => 'foo')

        render(<P />, node, () => {
          const message = messageFactory(api)
          window.postMessage(message, window.location.origin)

          setTimeout(() => {
            callback()
          }, 10)
        })
      }

      it('without auth', (done) => {
        const apiConfig = {}
        const messageFactory = () => ({foo: 'bar'})
        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="0"`)
          done()
        })
      })

      it('without access token', (done) => {
        const apiConfig = {}
        const messageFactory = () => ({auth: {}})
        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="0"`)
          done()
        })
      })

      it('with valid auth', (done) => {
        const clientId = 'client ID'
        const cookiePrefix = `auth${Math.random()}_`
        const apiConfig = {clientId, cookiePrefix}
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            expires_in: 3600,
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = {auth}
          return message
        }

        expect(document.cookie).toNotContain(cookiePrefix)
        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toContain(cookiePrefix)
          done()
        })
      })

      it('without expires_in -> no cookie', (done) => {
        const clientId = 'client ID'
        const cookiePrefix = `auth${Math.random()}_`
        const apiConfig = {clientId, cookiePrefix}
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = {auth}
          return message
        }

        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toNotContain(cookiePrefix)
          done()
        })
      })

      it('without client ID -> no cookie', (done) => {
        const cookiePrefix = `auth${Math.random()}_`
        const apiConfig = {cookiePrefix}
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            expires_in: 3600,
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = {auth}
          return message
        }

        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toNotContain(cookiePrefix)
          done()
        })
      })
    })

    it('restores auth from cookie', (done) => {
      const clientId = 'client ID'
      const cookiePrefix = `auth${Math.random()}_`
      const api = apiFactory({clientId, cookiePrefix})
      const P = api.ProviderHoc(() => 'foo')
      const auth = {
        access_token: 'access token',
        user_id: Math.random()
      }

      expect(document.cookie).toNotContain(cookiePrefix)
      document.cookie = `${api.getCookieName()}=${JSON.stringify(auth)}`

      render(<P />, node, () => {
        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          done()
        }, 10)
      })
    })
  })
})
