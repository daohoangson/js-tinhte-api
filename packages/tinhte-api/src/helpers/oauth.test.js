import { expect } from '@esm-bundle/chai'

import apiFactory from '../factory'

describe('helpers', () => {
  describe('oauth/token', () => {
    const apiRoot = 'https://xfrocks.com/api/'
    const clientId = 'gljf4391k3'
    const clientSecret = 'zw3lj0zox6be4z2'
    const username = 'api-tester'
    const email = 'api-tester@xfrocks.com'
    const password = '@pi-T3st3r'
    const userId = 2394

    describe('grant_type=password', () => {
      it('works with username/password', () => {
        const api = apiFactory({ apiRoot, clientId })
        return api.login(clientSecret, username, password)
          .then((json) => expect(json.user_id).equals(userId))
      })

      it('works with email/password', () => {
        const api = apiFactory({ apiRoot, clientId })
        return api.login(clientSecret, email, password)
          .then((json) => expect(json.user_id).equals(userId))
      })

      it('fails with wrong password', () => {
        const api = apiFactory({ apiRoot, clientId })
        return api.login(clientSecret, username, 'xxx')
          .then(
            () => Promise.reject(new Error('Unexpected success?!')),
            (reason) => expect(reason).an('Error')
          )
      })
    })

    describe('grant_type=refresh_token', () => {
      it('works', () => {
        const api = apiFactory({ apiRoot, clientId })
        return api.login(clientSecret, username, password)
          .then((loginJson) => api.refreshToken(clientSecret, loginJson.refresh_token))
          .then((refreshTokenJson) => expect(refreshTokenJson.user_id).equals(userId))
      })
    })
  })
})
