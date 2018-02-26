import React from 'react'
import PropTypes from 'prop-types'

const hoc = {
  ApiConsumer: (Component) => {
    const ApiConsumer = (props, context) => (
      <Component {...props} {...context} />
    )

    ApiConsumer.contextTypes = {
      api: PropTypes.object
    }

    return ApiConsumer
  },

  ApiProvider: (Component, api, internalApi) => {
    class ApiProvider extends React.Component {
      getChildContext () {
        return {api}
      }

      componentDidMount () {
        internalApi.setProviderMounted()
      }

      render () {
        return (
          <div className='ApiProvider'>
            <Component {...this.props} />
            <api.LoaderComponent />
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

export default hoc
