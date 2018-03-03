import React from 'react'
import PropTypes from 'prop-types'

import { isPlainObject, mustBePlainObject } from '../helpers'

const hocApiProvider = (Component, api, internalApi) => {
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
      if (typeof props.apiConfig !== 'undefined') {
        delete props.apiConfig
      }

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
