import React from 'react'
import { processCallback } from 'tinhte-api-react'

class ApiCallbackPage extends React.Component {
  componentDidMount () {
    processCallback(console.log)
  }

  render () {
    return <span>This is ApiCallback</span>
  }
}

export default ApiCallbackPage
