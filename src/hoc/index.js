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

  ApiProvider: (api, Component) => {
    class ApiProvider extends React.Component {
      getChildContext () {
        return {api}
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
