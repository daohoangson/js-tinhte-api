import React from 'react'

class Loader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      userId: 0
    }

    this.onWindowMessage = (e) => {
      if (!e || !e.data || !e.data.auth) {
        return
      }
      const auth = e.data.auth

      this.props.internalApi.setAuth(auth)
      this.setState({userId: this.props.api.getUserId()})
    }
  }

  componentDidMount () {
    if (typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function') {
      return
    }

    window.addEventListener('message', this.onWindowMessage)
  }

  componentWillUnmount () {
    if (typeof window === 'undefined' ||
      typeof window.removeEventListener !== 'function') {
      return
    }

    window.removeEventListener('message', this.onWindowMessage)
  }

  render () {
    if (typeof window === 'undefined' ||
      typeof window.location === 'undefined') {
      return null
    }

    const callbackUrl = this.props.internalApi.getCallbackUrl()
    if (!callbackUrl) {
      return null
    }

    const redirectUri = `${callbackUrl}?targetOrigin=${window.location.origin}`
    const authorizeUrl = this.props.internalApi.buildAuthorizeUrl(redirectUri)
    if (!authorizeUrl) {
      return null
    }

    return (
      <div className='Loader' data-user-id={this.state.userId}>
        <iframe sandbox='allow-scripts' src={authorizeUrl}
          style={{display: 'block', height: 0, width: 0}} />
        {this.props.children}
      </div>
    )
  }
}

export default Loader
