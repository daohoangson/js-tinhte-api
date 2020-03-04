import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

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
        setTimeout(() => {
          expect(node.innerHTML).toContain('<iframe')
          expect(node.innerHTML).toContain('src="')

          expect(node.innerHTML).toContain(api.getApiRoot())
          expect(node.innerHTML).toContain(encodeURIComponent(api.getCallbackUrl()))
          expect(node.innerHTML).toContain(encodeURIComponent(api.getClientId()))
          expect(node.innerHTML).toContain(encodeURIComponent(api.getScope()))
          done()
        }, 10)
      })
    })

    it('displays an iframe (with origin in callback url)', (done) => {
      const api = apiFactory({
        callbackUrl: '/path',
        clientId: 'client ID'
      })

      const P = api.ProviderHoc(() => 'foo')

      render(<P />, node, () => {
        setTimeout(() => {
          const callbackFullUrl = window.location.origin + '/path'
          expect(node.innerHTML).toContain(encodeURIComponent(callbackFullUrl))
          done()
        }, 10)
      })
    })

    it('does not show up with access token already set', () => {
      const api = apiFactory({
        auth: { accessToken: 'access token' },
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
        const messageFactory = () => ({ foo: 'bar' })
        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain('data-user-id="0"')
          done()
        })
      })

      it('without access token', (done) => {
        const apiConfig = {}
        const messageFactory = () => ({ auth: {} })
        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain('data-user-id="0"')
          done()
        })
      })

      it('with valid auth', (done) => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
        const apiConfig = { clientId, cookiePrefix }
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            expires_in: 3600,
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = { auth }
          return message
        }

        expect(document.cookie).toNotContain(cookiePrefix)
        document.cookie = `${apiConfig.cookiePrefix}session=${cookieSession}`

        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toContain(`${clientId}__${cookieSession}`)
          done()
        })
      })

      it('without expires_in -> set auth but no cookie', (done) => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
        const apiConfig = { clientId, cookiePrefix }
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = { auth }
          return message
        }

        expect(document.cookie).toNotContain(cookiePrefix)
        document.cookie = `${apiConfig.cookiePrefix}session=${cookieSession}`

        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toNotContain(`${clientId}__${cookieSession}`)
          done()
        })
      })

      it('without session -> set auth but no cookie', (done) => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const apiConfig = { clientId, cookiePrefix, debug: true }
        const userId = Math.random()
        const messageFactory = (api) => {
          const auth = {
            access_token: 'access token',
            expires_in: 3600,
            user_id: userId,
            state: api.getUniqueId()
          }
          const message = { auth }
          return message
        }

        expect(document.cookie).toNotContain(cookiePrefix)

        testReceiveMessage(apiConfig, messageFactory, () => {
          expect(node.innerHTML).toContain(`data-user-id="${userId}"`)
          expect(document.cookie).toNotContain(`${clientId}__`)
          done()
        })
      })
    })

    it('restores auth from cookie', (done) => {
      const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
      const api = apiFactory({ clientId, cookiePrefix })
      const P = api.ProviderHoc(() => 'foo')
      const auth = {
        access_token: 'access token',
        user_id: Math.random()
      }

      expect(document.cookie).toNotContain(cookiePrefix)
      document.cookie = `${cookiePrefix}session=${cookieSession}`
      document.cookie = `${clientId}__${cookieSession}=${JSON.stringify(auth)}`

      render(<P />, node, () => {
        setTimeout(() => {
          expect(node.innerHTML).toContain(`data-user-id="${auth.user_id}"`)
          done()
        }, 10)
      })
    })

    it('skips auth without user/session cookie', (done) => {
      const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const api = apiFactory({ clientId, cookiePrefix })
      const P = api.ProviderHoc(() => 'foo')

      expect(document.cookie).toNotContain(cookiePrefix)

      render(<P />, node, () => {
        setTimeout(() => {
          expect(node.innerHTML).toContain('src=""')
          done()
        }, 10)
      })
    })
  })
})
