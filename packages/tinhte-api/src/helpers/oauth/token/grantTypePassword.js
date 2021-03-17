import { algos, encrypt } from '../../crypt'

const algo = algos[0]

const grantTypePassword = (api, internalApi, clientSecret, username, password) => {
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

  return api.fetchOne(options)
    .then((json) => {
      /* istanbul ignore else */
      if (json.user_id) {
        internalApi.log('oauth/token?grant_type=password: %s -> %d', username, json.user_id)
      }

      return json
    })
}

export default grantTypePassword
