import React from 'react'

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
      const {api, internalApi} = this.props
      internalApi.log('Received auth', auth)

      api.setAuth(auth)
      this.setState({userId: api.getUserId()})
    }
  }

  componentDidMount () {
    const authorizeUrl = this.props.internalApi.buildAuthorizeUrl()
    if (authorizeUrl) {
      this.setState({src: authorizeUrl})
    }

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('message', this.onWindowMessage)
    }
  }

  componentWillUnmount () {
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('message', this.onWindowMessage)
    }
  }

  render () {
    return (
      <iframe className='ApiLoader' data-user-id={this.state.userId}
        sandbox='allow-scripts' src={this.state.src}
        style={{display: 'block', height: 0, width: 0}} />
    )
  }
}

export default Loader
