import FormData from 'form-data'

const grantTypePassword = (api, internalApi, clientSecret, username, password) => {
  let formData = new FormData()
  formData.append('grant_type', 'password')
  formData.append('client_id', api.getClientId())
  formData.append('client_secret', clientSecret)
  formData.append('username', username)
  formData.append('password', password)

  const options = {
    body: formData,
    method: 'POST',
    uri: 'oauth/token'
  }

  return api.fetchOne(options)
    .then((json) => {
      if (json.user_id) {
        internalApi.log('oauth/token?grant_type=password: %s -> %d', username, json.user_id)
      }

      return json
    })
}

export default grantTypePassword
