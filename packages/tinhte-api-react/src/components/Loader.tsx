import Cookies from 'js-cookie'
import React from 'react'
import { ReactApi, ReactApiInternal } from '../types'

interface _LoaderProps {
  api: ReactApi
  internalApi: ReactApiInternal
}

interface _LoaderState {
  listener: (event: MessageEvent) => void
  src: string
  userId: number
}

const buildAuthorizeUrl = (api: ReactApi): string | undefined => {
  const clientId = api.getClientId()
  const callbackUrl = api.getCallbackUrl()
  if (clientId.length === 0 || callbackUrl.length === 0) {
    return
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

const generateCookieName = (api: ReactApi): string | undefined => {
  const prefix = api.getCookiePrefix()
  if (prefix.length === 0) {
    // no prefix -> always auth
    return ''
  }

  const cookieSession = Cookies.get(`${prefix}session`) ?? ''
  const cookieUser = Cookies.get(`${prefix}user`) ?? ''
  if (cookieSession.length < 1 && cookieUser.length === 0) {
    // no session AND user -> no authentication
    return
  }
  if (cookieSession.length === 0) {
    // no session -> try to auth
    return ''
  }

  const safeClientId = api.getClientId().replace(/[^a-z0-9]/gi, '')
  const safeSession = cookieSession.replace(/[^a-z0-9]/gi, '')
  return `${safeClientId}__${safeSession}`
}

const getCookie = (api: ReactApi): { name: string, value?: any } | undefined => {
  const name = generateCookieName(api)
  if (name === undefined) {
    return
  } else if (name.length === 0) {
    return { name }
  }

  const value = Cookies.getJSON(name)
  return { name, value }
}

const setCookie = (api: ReactApi, auth: any): { name: string, value: object, expires: Date } | undefined => {
  if (auth.access_token === undefined || auth.expires_in === undefined || auth.user_id === undefined) {
    return
  }

  const name = generateCookieName(api)
  if (name === undefined || name.length === 0) {
    return
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

export class Loader extends React.Component<_LoaderProps, _LoaderState, any> {
  constructor (props: _LoaderProps) {
    super(props)

    this.state = {
      listener: (event) => {
        const { data: { auth } } = event
        const { api, internalApi } = this.props
        internalApi.log('Received auth via window message', auth)

        internalApi.setAuth(auth)
        const userId = api.getUserId()
        this.setState({ userId })

        const accessToken = api.getAccessToken()
        if (accessToken.length > 0 && accessToken === auth.access_token) {
          const cookie = setCookie(api, auth)
          if (cookie !== undefined) {
            internalApi.log('Set cookie %s until %s', cookie.name, cookie.expires)
          }
        }
      },
      src: '',
      userId: 0
    }
  }

  componentDidMount (): void {
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('message', this.state.listener)
    }

    const { api, internalApi } = this.props
    const cookie = getCookie(api)
    if (cookie === undefined) {
      internalApi.log('Skipped authentication due to bad config or no cookie')
      internalApi.setAuth({ state: api.getUniqueId() })
      return
    }

    const value = cookie.value
    if (value !== undefined) {
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
    if (authorizeUrl !== undefined) {
      this.setState({ src: authorizeUrl })
    }
  }

  componentWillUnmount (): void {
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('message', this.state.listener)
    }
  }

  render (): React.ReactElement {
    return (
      <iframe
        className='ApiLoader' data-user-id={this.state.userId}
        sandbox='allow-same-origin allow-scripts' src={this.state.src}
        style={{ display: 'block', height: 0, width: 0 }}
      />
    )
  }
}
