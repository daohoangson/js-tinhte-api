import React from 'react'

import { ReactApi, ReactApiContext, ReactApiInternal, ReactApiProviderProps } from '../types'
import ApiContext from './ApiContext'

interface _ApiProviderState {
  apiContext: ReactApiContext
}

export const ProviderHoc = <P extends object>(Component: React.ComponentType<P>, api: ReactApi, internalApi: ReactApiInternal): React.ComponentType<P & ReactApiProviderProps> =>
  class ApiProvider extends React.Component<P & ReactApiProviderProps, _ApiProviderState> {
    constructor (props: P & ReactApiProviderProps) {
      super(props)

      const { apiConfig, apiData } = props
      if (apiConfig != null) {
        api.updateConfig(apiConfig)
      }

      this.state = {
        apiContext: {
          api,
          apiData: apiData ?? {},
          internalApi
        }
      }
    }

    componentDidMount (): void {
      internalApi.setProviderMounted()
    }

    render (): React.ReactElement {
      const props: any = { ...this.props }
      delete props.apiConfig
      delete props.apiData

      return (
        <ApiContext.Provider value={this.state.apiContext}>
          <Component {...props} />
          {api.getAccessToken() === '' && <internalApi.LoaderComponent />}
        </ApiContext.Provider>
      )
    }
  }
