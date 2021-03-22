import React from 'react'
import { apiFactory as coreFactory } from 'tinhte-api'
import { Api, ApiAuth, ApiConfig } from 'tinhte-api/src/types'

import { Callback } from './components/Callback'
import { Loader } from './components/Loader'
import helperCallbacksInit from './helpers/callbacks'
import { fetchApiDataForProvider } from './helpers/fetchApiDataForProvider'
import { ConsumerHoc } from './hoc/ApiConsumer'
import { ProviderHoc } from './hoc/ApiProvider'
import { ReactApi, ReactApiInternal } from './types'

const reactFactory = (apiCore: Api): ReactApi => {
  let providerMounted = false

  const internalApi: ReactApiInternal = {

    LoaderComponent: () => <Loader api={api} internalApi={internalApi} />,

    log: (...args) => {
      if (!api.getDebug()) {
        return false
      }

      const args0 = args[0]
      if (typeof args0 === 'string') {
        args[0] = `[tinhte-api-react#${api.getUniqueId()}] ${args0}`
      }

      console.log.apply(console, args)
      return true
    },

    setAuth: (newAuth) => {
      const auth: ApiAuth = {}
      const done = (): void => {
        api.updateConfig({ auth })

        // eslint-disable-next-line
        callbacks.fetchList(callbackListForAuth)
      }

      if (newAuth === undefined || newAuth.state !== api.getUniqueId()) {
        return done()
      }

      if (typeof newAuth.access_token === 'string') {
        auth.accessToken = newAuth.access_token
      }

      let userId = 0
      if (typeof newAuth.user_id === 'number') {
        userId = newAuth.user_id
      } else if (typeof newAuth.user_id === 'string') {
        userId = parseInt(newAuth.user_id)
      }
      if (userId > 0) {
        auth.userId = userId
      }

      return done()
    },

    setProviderMounted: () => {
      if (providerMounted) {
        return 0
      }

      providerMounted = true

      return callbacks.fetchList(callbackListForProviderMount)
    }
  }

  const api: ReactApi = {
    ...apiCore,

    clone: (config: ApiConfig) => {
      const clonedApi = apiCore.clone(config)
      return reactFactory(clonedApi)
    },

    fetchApiDataForProvider: async (rootElement) =>
      await fetchApiDataForProvider(api, internalApi, rootElement),

    onAuthenticated: (callback) =>
      callbacks.add(callbackListForAuth, callback, api.hasAuth()),

    onProviderMounted: (callback) =>
      callbacks.add(callbackListForProviderMount, callback, providerMounted),

    CallbackComponent: () => <Callback api={api} internalApi={internalApi} />,

    ConsumerHoc,

    ProviderHoc: (Component) => ProviderHoc(Component, api, internalApi)
  }

  const callbackListForAuth = { name: 'auth', items: [] }
  const callbackListForProviderMount = { name: 'provider mount', items: [] }
  const callbacks = helperCallbacksInit(api, internalApi)

  return api
}

const apiFactory = (config: ApiConfig = {}): ReactApi =>
  reactFactory(coreFactory(config))

export default apiFactory
