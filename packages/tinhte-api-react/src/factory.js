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

    setAuth: (newAuth) => {
      const auth = {}
      const done = () => {
        api.updateConfig({ auth })
        callbacks.fetchList(callbackListForAuth)
      }

      if (!newAuth || newAuth.state !== api.getUniqueId()) {
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

  const callbackListForAuth = { name: 'auth', items: [] }
  const callbackListForProviderMount = { name: 'provider mount', items: [] }
  const callbacks = helperCallbacksInit(api, internalApi)

  api.CallbackComponent = () => <Callback api={api} internalApi={internalApi} />

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

  if (api.getDebug()) {
    api.getInternalApi = () => internalApi
  }

  return api
}

const apiFactory = (config = {}) => {
  const apiCore = coreFactory(config)
  const apiReact = reactFactory(apiCore)
  return apiReact
}

export default apiFactory
