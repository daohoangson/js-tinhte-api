import Cookies from 'js-cookie'
import React from 'react'

const buildAuthorizeUrl = (api) => {
  const clientId = api.getClientId()
  const callbackUrl = api.getCallbackUrl()
  if (!clientId || !callbackUrl) {
    return null
  }

  const encodedUniqueId = encodeURIComponent(api.getUniqueId())
  const guestRedirectUri = `${callbackUrl}#user_id=0&state=${encodedUniqueId}`
  const redirectUri = callbackUrl

  const authorizeUrl = `${api.getApiRoot()}?oauth/authorize&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `guest_redirect_uri=${encodeURIComponent(guestRedirectUri)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    'response_type=token&' +
    `scope=${encodeURIComponent(api.getScope())}&` +
    `state=${encodedUniqueId}`

  return authorizeUrl
}

const getCookie = (api) => {
  const name = api.getCookieName()
  if (!name) {
    return null
  }

  const value = Cookies.getJSON(name)
  if (!value) {
    return null
  }

  value._cookieName = name

  return value
}

const setCookie = (api, auth) => {
  if (!auth.access_token || !auth.expires_in || !auth.user_id) {
    return null
  }

  const name = api.getCookieName()
  if (!name) {
    return null
  }

  const value = {
    access_token: auth.access_token,
    user_id: auth.user_id
  }
  // set TTL to half of expires_in to account for server issue
  const ttl = auth.expires_in / 2
  const expires = new Date(new Date().getTime() + ttl * 1000)
  Cookies.set(name, value, { expires })

  return { name, value, expires }
}

class Loader extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      src: '',
      userId: 0
    }

    this.onWindowMessage = (e) => {
      if (!e || !e.data || !e.data.auth) {
        return
      }
      const auth = e.data.auth
      const { api, internalApi } = this.props
      internalApi.log('Received auth via window message', auth)

      api.setAuth(auth)
      this.setState({ userId: api.getUserId() })

      const accessToken = api.getAccessToken()
      if (accessToken && accessToken === auth.access_token) {
        const cookie = setCookie(api, auth)
        if (cookie !== null) {
          internalApi.log('Set cookie %s until %s', cookie.name, cookie.expires)
        }
      }
    }
  }

  componentDidMount () {
    const { api, internalApi } = this.props
    const cookieAuth = getCookie(api)
    if (cookieAuth !== null) {
      internalApi.log('Restored auth from cookie', cookieAuth)

      api.setAuth({
        ...cookieAuth,
        state: api.getUniqueId()
      })
      this.setState({ userId: api.getUserId() })

      // skip initializing further once we have recovered auth from cookie
      return
    }

    const authorizeUrl = buildAuthorizeUrl(api)
    if (authorizeUrl) {
      this.setState({ src: authorizeUrl })
    }

    /* istanbul ignore else */
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('message', this.onWindowMessage)
    }
  }

  componentWillUnmount () {
    /* istanbul ignore else */
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('message', this.onWindowMessage)
    }
  }

  render () {
    return (
      <iframe className='ApiLoader' data-user-id={this.state.userId}
        sandbox='allow-same-origin allow-scripts' src={this.state.src}
        style={{ display: 'block', height: 0, width: 0 }} />
    )
  }
}

export default Loader
