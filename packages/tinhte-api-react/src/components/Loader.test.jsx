import { render, waitFor } from '@testing-library/react'
import React from 'react'

import { apiFactory } from '..'

describe('components', () => {
  describe('Loader', () => {
    it('displays an iframe', async () => {
      const api = apiFactory({
        callbackUrl: 'callback url',
        clientId: 'client ID',
        scope: 'scope1 scope2'
      })

      const P = api.ProviderHoc(() => 'foo')

      const { container } = render(<P />)

      const iframe = await waitFor(() => container.querySelector('iframe'))
      const url = new URL(iframe.src)
      expect(url.href.startsWith(api.getApiRoot())).toBeTruthy()

      const { searchParams } = url
      expect(searchParams.get('client_id')).toBe(api.getClientId())
      expect(searchParams.get('redirect_uri')).toBe(api.getCallbackUrl())
      expect(searchParams.get('scope')).toBe(api.getScope())
    })

    it('displays an iframe (with origin in callback url)', async () => {
      const api = apiFactory({
        callbackUrl: '/path',
        clientId: 'client ID'
      })

      const P = api.ProviderHoc(() => 'foo')

      const { container } = render(<P />)

      const iframe = await waitFor(() => container.querySelector('iframe'))
      const { searchParams } = new URL(iframe.src)
      const callbackFullUrl = window.location.origin + '/path'
      expect(searchParams.get('redirect_uri')).toBe(callbackFullUrl)
    })

    it('displays an iframe with user cookie', async () => {
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const api = apiFactory({
        callbackUrl: '/path',
        clientId: 'client ID',
        cookiePrefix
      })
      const P = api.ProviderHoc(() => 'foo')

      expect(document.cookie).does.not.contain(cookiePrefix)
      document.cookie = `${cookiePrefix}user=xxx`

      const { container } = render(<P />)

      const iframe = await waitFor(() => container.querySelector('iframe'))
      expect(iframe.getAttribute('src')).not.toBe('')
    })

    it('displays an iframe with session cookie', async () => {
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const api = apiFactory({
        callbackUrl: '/path',
        clientId: 'client ID',
        cookiePrefix
      })
      const P = api.ProviderHoc(() => 'foo')

      expect(document.cookie).does.not.contain(cookiePrefix)
      document.cookie = `${cookiePrefix}session=xxx`

      const { container } = render(<P />)

      const iframe = await waitFor(() => container.querySelector('iframe'))
      expect(iframe.getAttribute('src')).not.toBe('')
    })

    it('skips auth without user/session cookie', async () => {
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const api = apiFactory({
        callbackUrl: '/path',
        clientId: 'client ID',
        cookiePrefix
      })
      const P = api.ProviderHoc(() => 'foo')

      let hasAuthenticated = false
      api.onAuthenticated(() => (hasAuthenticated = true))

      expect(document.cookie).does.not.contain(cookiePrefix)

      const { container } = render(<P />)

      await waitFor(() => expect(hasAuthenticated).equals(true))
      expect(container.querySelector('iframe').getAttribute('src')).toBe('')
    })

    it('does not show up with access token already set', async () => {
      const api = apiFactory({
        auth: { accessToken: 'access token' },
        callbackUrl: 'callback url',
        clientId: 'client ID',
        scope: 'scope1 scope2'
      })

      const P = api.ProviderHoc(() => 'foo')

      let hasAuthenticated = false
      api.onAuthenticated(() => (hasAuthenticated = true))

      const { container } = render(<P />)

      await waitFor(() => expect(hasAuthenticated).equals(true))
      expect(container.querySelector('iframe')).toBeNull()
    })

    describe('receives message', () => {
      const testReceiveMessage = async (apiConfig, messageFactory) => {
        const api = apiFactory({ ...apiConfig, callbackUrl: '/callback-url' })
        const P = api.ProviderHoc(() => 'foo')

        const renderResult = render(<P />)
        const { container } = renderResult
        await waitFor(() => expect(container.querySelector('iframe')).toBeInTheDocument())

        const message = messageFactory(api)
        window.postMessage(message, window.location.origin)

        return renderResult
      }

      it('without cookiePrefix -> set auth but no cookie', async () => {
        const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
        const apiConfig = { clientId }
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

        const cookieBefore = document.cookie

        const { container } = await testReceiveMessage(apiConfig, messageFactory)
        await waitFor(() => expect(container.querySelector('iframe').dataset.userId).toBe(String(userId)))
        expect(document.cookie).equals(cookieBefore)
      })

      it('without auth', async () => {
        const apiConfig = {}
        const messageFactory = () => ({ foo: 'bar' })
        const { container } = await testReceiveMessage(apiConfig, messageFactory)

        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(container.querySelector('iframe').dataset.userId).toBe('0')
      })

      it('without access token', async () => {
        const apiConfig = {}
        const messageFactory = () => ({ auth: {} })
        const { container } = await testReceiveMessage(apiConfig, messageFactory)

        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(container.querySelector('iframe').dataset.userId).toBe('0')
      })

      it('with valid auth', async () => {
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

        expect(document.cookie).does.not.contain(cookiePrefix)
        document.cookie = `${apiConfig.cookiePrefix}session=${cookieSession}`

        const { container } = await testReceiveMessage(apiConfig, messageFactory)
        await waitFor(() => expect(container.querySelector('iframe').dataset.userId).toBe(String(userId)))
        expect(document.cookie).contains(`${clientId}__${cookieSession}`)
      })

      it('without expires_in -> set auth but no cookie', async () => {
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

        expect(document.cookie).does.not.contain(cookiePrefix)
        document.cookie = `${apiConfig.cookiePrefix}session=${cookieSession}`

        const { container } = await testReceiveMessage(apiConfig, messageFactory)
        await waitFor(() => expect(container.querySelector('iframe').dataset.userId).toBe(String(userId)))
        expect(document.cookie).does.not.contain(`${clientId}__${cookieSession}`)
      })
    })

    it('restores auth from cookie', async () => {
      const clientId = `cid${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const cookiePrefix = `cookie_prefix_${Math.random()}`.replace(/[^a-z0-9]/gi, '')
      const cookieSession = `${Math.random()}`.replace(/[^0-9]/gi, '')
      const api = apiFactory({ clientId, cookiePrefix })
      const P = api.ProviderHoc(() => 'foo')
      const auth = {
        access_token: 'access token',
        user_id: Math.random()
      }

      expect(document.cookie).does.not.contain(cookiePrefix)
      document.cookie = `${cookiePrefix}session=${cookieSession}`
      document.cookie = `${clientId}__${cookieSession}=${JSON.stringify(auth)}`

      const { container } = render(<P />)

      await waitFor(() => expect(container.querySelector('iframe').dataset.userId).toBe(String(auth.user_id)))
    })
  })
})
