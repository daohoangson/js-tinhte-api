import React from 'react'
import PropTypes from 'prop-types'

class Loader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      userId: 0
    }

    if (!window) {
      return
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
    if (window && window.addEventListener) {
      window.addEventListener('message', this.onWindowMessage)
    }
  }

  componentWillUnmount () {
    if (window && window.removeEventListener) {
      window.removeEventListener('message', this.onWindowMessage)
    }
  }

  render () {
    const redirectUri = `${this.props.callbackUrl}?targetOrigin=${window.location.origin}`

    if (!this.props.buildAuthorizeUrl) {
      return null
    }
    const authorizeUrl = this.props.buildAuthorizeUrl(redirectUri)

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
  setAuth: PropTypes.func.isRequired
}

export default Loader
