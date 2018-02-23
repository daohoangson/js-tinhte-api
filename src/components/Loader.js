import React from 'react'
import PropTypes from 'prop-types'

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

      if (!this.props.setAuth) {
        return
      }
      this.props.setAuth(auth)

      if (!this.props.api) {
        return
      }
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
    if (!this.props.callbackUrl ||
      typeof window === 'undefined' ||
      typeof window.location === 'undefined') {
      return null
    }
    const redirectUri = `${this.props.callbackUrl}?targetOrigin=${window.location.origin}`

    if (!this.props.buildAuthorizeUrl || !this.props.scope) {
      return null
    }
    const authorizeUrl = this.props.buildAuthorizeUrl(redirectUri, this.props.scope)
    if (!authorizeUrl) {
      return null
    }

    return (
      <div data-user-id={this.state.userId}>
        <iframe sandbox='allow-scripts' src={authorizeUrl}
          style={{display: 'block', height: 0, width: 0}} />
        {this.props.children}
      </div>
    )
  }
}

Loader.propTypes = {
  api: PropTypes.object.isRequired,
  buildAuthorizeUrl: PropTypes.func.isRequired,
  callbackUrl: PropTypes.string.isRequired,
  scope: PropTypes.string,
  setAuth: PropTypes.func.isRequired
}

Loader.defaultProps = {
  scope: 'read'
}

export default Loader
