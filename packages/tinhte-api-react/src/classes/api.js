import React from 'react'
import { Api as ApiBase } from 'tinhte-api'

import Callback from '../components/Callback'
import Loader from '../components/Loader'
import helperCallbacksInit from '../helpers/callbacks'
import fetchApiDataForProvider from '../helpers/fetchApiDataForProvider'
import ApiConsumer from '../hoc/ApiConsumer'
import ApiProvider from '../hoc/ApiProvider'

class ApiReactInternal {
  constructor(api) {
    this.api = api

    this._callbackListForAuth = { name: 'auth', items: [] }
    this._callbackListForProviderMount = { name: 'provider mount', items: [] }
    this._callbacks = helperCallbacksInit(api)
    this._providerMounted = false

    this.LoaderComponent = () => <Loader api={this.api} />
  }

  onAuthenticated (callback) {
    return this._callbacks.add(this._callbackListForAuth, callback, this.api.auth !== null)
  }

  onProviderMounted (callback) {
    return this._callbacks.add(this._callbackListForProviderMount, callback, this._providerMounted)
  }

  setProviderMounted () {
    if (this._providerMounted) {
      return 0
    }

    this._providerMounted = true

    return this._callbacks.fetchList(this._callbackListForProviderMount)
  }
}

export default class ApiReact extends ApiBase {
  constructor(config) {
    super(config)

    this._internalApi = new ApiReactInternal(this);
    this.CallbackComponent = () => <Callback api={this} />
  }

  ConsumerHoc (Component) {
    return ApiConsumer(Component)
  }

  ProviderHoc (Component) {
    return ApiProvider(Component, this, this._internalApi)
  }

  clone (config) {
    return new ApiReact(this._cloneConfig(config))
  }

  fetchApiDataForProvider (rootElement) {
    return fetchApiDataForProvider(this, rootElement)
  }

  onAuthenticated (callback) {
    return this._internalApi.onAuthenticated(callback)
  }

  onProviderMounted (callback) {
    return this._internalApi.onProviderMounted(callback)
  }

  setAuth (newAuth) {
    ApiBase.prototype.setAuth.call(this, newAuth)
    this._internalApi._callbacks.fetchList(this._internalApi._callbackListForAuth)
  }
}
