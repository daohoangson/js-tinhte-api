import React from 'react'
import { processCallback } from '../src'

class ApiCallbackPage extends React.Component {
  componentDidMount () {
    processCallback(console.log)
  }

  render () {
    return <span>This is ApiCallback</span>
  }
}

export default ApiCallbackPage
