import React from 'react'
import { apiFactory as coreFactory } from 'tinhte-api'

import Callback from './components/Callback'
import Loader from './components/Loader'
import helperCallbacksInit from './helpers/callbacks'
import fetchApiDataForProvider from './helpers/fetchApiDataForProvider'
import ApiConsumer from './hoc/ApiConsumer'
import ApiProvider from './hoc/ApiProvider'

const reactFactory = (apiCore) => {
  const api = apiCore

  let providerMounted = false

  const internalApi = {

    LoaderComponent: () => <Loader api={api} internalApi={internalApi} />,

    log: function (message) {
      if (!api.getDebug()) {
        return false
      }

      const args = arguments
      args[0] = `[tinhte-api-react#${api.getUniqueId()}] ${args[0]}`

      console.log.apply(this, args)
      return true
    },

    setProviderMounted: () => {
      if (providerMounted) {
        return 0
      }

      providerMounted = true

      return callbacks.fetchList(callbackListForProviderMount)
    }

  }

  const callbackListForAuth = { name: 'auth', items: [] }
  const callbackListForProviderMount = { name: 'provider mount', items: [] }
  const callbacks = helperCallbacksInit(api, internalApi)

  api.CallbackComponent = () => <Callback api={api} />

  api.ConsumerHoc = ApiConsumer

  api.ProviderHoc = (Component) => ApiProvider(Component, api, internalApi)

  const coreClone = api.clone
  api.clone = (config = {}) => {
    const clonedApi = coreClone.call(api, config)
    return reactFactory(clonedApi)
  }

  api.fetchApiDataForProvider = (rootElement) =>
    fetchApiDataForProvider(api, internalApi, rootElement)

  api.onAuthenticated = (callback) =>
    callbacks.add(callbackListForAuth, callback, api.hasAuth())

  api.onProviderMounted = (callback) =>
    callbacks.add(callbackListForProviderMount, callback, providerMounted)

  const coreSetAuth = api.setAuth
  api.setAuth = (newAuth) => {
    coreSetAuth.call(api, newAuth)
    callbacks.fetchList(callbackListForAuth)
  }

  return api
}

const apiFactory = (config = {}) => {
  const apiCore = coreFactory(config)
  const apiReact = reactFactory(apiCore)
  return apiReact
}

export default apiFactory
