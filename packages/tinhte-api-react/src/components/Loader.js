import Cookies from 'js-cookie'
import React from 'react'

const buildAuthorizeUrl = (api) => {
  const clientId = api.getClientId()
  const callbackUrl = api.getCallbackUrl()
  if (!clientId || !callbackUrl) {
    return null
  }

  const encodedUniqueId = encodeURIComponent(api.getUniqueId())
  const callbackFullUrl = callbackUrl.charAt(0) === '/' ? window.location.origin + callbackUrl : callbackUrl
  const guestRedirectUri = `${callbackFullUrl}#user_id=0&state=${encodedUniqueId}`
  const redirectUri = callbackFullUrl

  const authorizeUrl = `${api.getApiRoot()}?oauth/authorize&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `guest_redirect_uri=${encodeURIComponent(guestRedirectUri)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    'response_type=token&' +
    `scope=${encodeURIComponent(api.getScope())}&` +
    `state=${encodedUniqueId}`

  return authorizeUrl
}

const generateCookieName = (api) => {
  const prefix = api.getCookiePrefix()
  if (!prefix) {
    // no prefix -> always auth
    return ''
  }

  const cookieSession = Cookies.get(`${prefix}session`)
  const cookieUser = Cookies.get(`${prefix}user`)
  if (!cookieSession && !cookieUser) {
    // no session AND user -> no authentication
    return null
  }
  if (!cookieSession) {
    // no session -> try to auth
    return ''
  }

  const safeClientId = api.getClientId().replace(/[^a-z0-9]/gi, '')
  const safeSession = cookieSession.replace(/[^a-z0-9]/gi, '')
  if (!safeClientId || !safeSession) {
    // bad data -> no auth
    return null
  }

  return `${safeClientId}__${safeSession}`
}

const getCookie = (api) => {
  const name = generateCookieName(api)
  if (!name) {
    if (name === null) {
      return null
    } else {
      return { name }
    }
  }

  const value = Cookies.getJSON(name)
  return { name, value }
}

const setCookie = (api, auth) => {
  if (!auth.access_token || !auth.expires_in || !auth.user_id) {
    return null
  }

  const name = generateCookieName(api)
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

      internalApi.setAuth(auth)
      const userId = api.getUserId()
      this.setState({ userId })

      const accessToken = api.getAccessToken()
      if (userId > 0 && accessToken && accessToken === auth.access_token) {
        const cookie = setCookie(api, auth)
        if (cookie !== null) {
          internalApi.log('Set cookie %s until %s', cookie.name, cookie.expires)
        }
      }
    }
  }

  componentDidMount () {
    const { api, internalApi } = this.props
    const cookie = getCookie(api)
    if (cookie === null) {
      // bad config or no cookie -> no auth
      return
    }
    if (cookie.value) {
      internalApi.log('Restored auth from cookie', cookie)

      internalApi.setAuth({
        ...cookie.value,
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
      <iframe
        className='ApiLoader' data-user-id={this.state.userId}
        sandbox='allow-same-origin allow-scripts' src={this.state.src}
        style={{ display: 'block', height: 0, width: 0 }}
      />
    )
  }
}

export default Loader
