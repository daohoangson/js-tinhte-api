import React from 'react'

import errors from '../helpers/errors'
import ApiContext from './ApiContext'

const hocApiProvider = (Component, api, internalApi) => {
  if (!Component || !api || !internalApi) {
    throw new Error(errors.API_PROVIDER.REQUIRED_PARAMS_MISSING)
  }

  class ApiProvider extends React.Component {
    constructor (props) {
      super(props)

      if (props.apiConfig) {
        api.updateConfig(props.apiConfig)
      }

      const apiData = this.props.apiData || {}
      const apiContext = { api, apiData }
      this.state = { apiContext }
    }

    componentDidMount () {
      internalApi.setProviderMounted()
    }

    render () {
      const props = { ...this.props }
      delete props.apiConfig
      delete props.apiData

      return (
        <ApiContext.Provider className='ApiProvider' value={this.state.apiContext}>
          <Component {...props} />
          { api.getAccessToken() === '' && <internalApi.LoaderComponent /> }
        </ApiContext.Provider>
      )
    }
  }

  return ApiProvider
}

export default hocApiProvider
