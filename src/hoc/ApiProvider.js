import React from 'react'
import PropTypes from 'prop-types'

import { isPlainObject, mustBePlainObject } from '../helpers'
import errors from '../helpers/errors'

const hocApiProvider = (Component, api, internalApi) => {
  if (!Component || !api || !internalApi) {
    throw new Error(errors.API_PROVIDER.REQUIRED_PARAMS_MISSING)
  }

  class ApiProvider extends React.Component {
    constructor (props) {
      super(props)

      if (isPlainObject(props.apiConfig)) {
        internalApi.updateConfig(props.apiConfig)
      }
    }

    componentDidMount () {
      internalApi.setProviderMounted()
    }

    getChildContext () {
      let { apiData } = this.props
      apiData = mustBePlainObject(apiData)

      return {api, apiData, internalApi}
    }

    render () {
      const props = {...this.props}
      delete props.apiConfig
      delete props.apiData

      return (
        <div className='ApiProvider'>
          <Component {...props} />
          { api.getAccessToken() === '' && <internalApi.LoaderComponent /> }
        </div>
      )
    }
  }

  ApiProvider.childContextTypes = {
    api: PropTypes.object,
    apiData: PropTypes.object,
    internalApi: PropTypes.object
  }

  return ApiProvider
}

export default hocApiProvider
