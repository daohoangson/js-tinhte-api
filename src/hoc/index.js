import React from 'react'
import PropTypes from 'prop-types'

import Loader from '../components/Loader'

export default {
  ApiConsumer: (Component) => {
    const ApiConsumer = (props, context) => (
      <Component {...props} {...context} />
    )

    ApiConsumer.contextTypes = {
      api: PropTypes.object
    }

    return ApiConsumer
  },

  ApiProvider: (api, internalApi, Component) => {
    class ApiProvider extends React.Component {
      getChildContext () {
        return {api}
      }

      render () {
        return (
          <div className='ApiProvider'>
            <Component {...this.props} />
            <Loader api={api} internalApi={internalApi} />
          </div>
        )
      }
    }

    ApiProvider.childContextTypes = {
      api: PropTypes.object
    }

    return ApiProvider
  }
}
