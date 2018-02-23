import React from 'react'

class Loader extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      src: '',
      userId: 0
    }

    this.srcTimer = null
    this.srcUpdate = () => {
      const authorizeUrl = this.props.internalApi.buildAuthorizeUrl()
      if (authorizeUrl) {
        this.setState({src: authorizeUrl})
      }
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

  componentWillMount () {
    const delayMs = this.props.internalApi.getDelayMs()
    if (delayMs > 0) {
      this.srcTimer = setTimeout(this.srcUpdate, delayMs)
    } else {
      this.srcUpdate()
    }
  }

  componentDidMount () {
    if (typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function') {
      window.addEventListener('message', this.onWindowMessage)
    }
  }

  componentWillUnmount () {
    if (this.srcTimer) {
      clearTimeout(this.srcTimer)
    }

    if (typeof window !== 'undefined' &&
      typeof window.removeEventListener === 'function') {
      window.removeEventListener('message', this.onWindowMessage)
    }
  }

  render () {
    return (
      <iframe className='Loader' data-user-id={this.state.userId}
        sandbox='allow-scripts' src={this.state.src}
        style={{display: 'block', height: 0, width: 0}} />
    )
  }
}

export default Loader
