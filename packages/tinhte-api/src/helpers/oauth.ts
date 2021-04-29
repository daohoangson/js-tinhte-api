import { Api, ApiInternal } from '../types'
import { algos, encrypt } from './crypt'

const algo = algos[0]

export async function grantTypePassword (api: Api, internalApi: ApiInternal, clientSecret: string, username: string, password: string): Promise<any> {
  const formData = new FormData()
  formData.append('grant_type', 'password')
  formData.append('client_id', api.getClientId())
  formData.append('username', username)
  formData.append('password', encrypt(algo, password, clientSecret))
  formData.append('password_algo', algo)

  const options = {
    body: formData,
    method: 'POST',
    uri: 'oauth/token'
  }

  const json = await api.fetchOne(options)
  if (typeof json === 'object') {
    const { user_id: userId } = json
    if (userId > 0) {
      internalApi.log('oauth/token?grant_type=password: %s -> %d', username, userId)
    }
  }

  return json
}

export async function grantTypeRefreshToken (api: Api, internalApi: ApiInternal, clientSecret: string, refreshToken: string): Promise<any> {
  const formData = new FormData()
  formData.append('grant_type', 'refresh_token')
  formData.append('client_id', api.getClientId())
  formData.append('client_secret', clientSecret)
  formData.append('refresh_token', refreshToken)

  const options = {
    body: formData,
    method: 'POST',
    uri: 'oauth/token'
  }

  const json = await api.fetchOne(options)
  if (typeof json === 'object') {
    const { user_id: userId } = json
    if (userId > 0) {
      internalApi.log('oauth/token?grant_type=refresh_token: %s -> %d', refreshToken, json.user_id)
    }
  }

  return json
}
