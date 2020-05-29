import React from 'react'
import { standardizeReqOptions } from 'tinhte-api'

import errors from '../helpers/errors'
import ApiContext from './ApiContext'

const createFetchObject = (api, element, fetches, key) => {
  let fetch = fetches[key]
  if (typeof fetch === 'function') {
    fetch = fetch(api, element.props)
    if (!fetch) {
      return null
    }
  }

  if (
    typeof fetch !== 'object' ||
    typeof fetch.body !== 'undefined' ||
    typeof fetch.parseJson !== 'undefined'
  ) {
    return null
  }

  return { ...fetch }
}

const useApiData = (apiConsumer, fetches) => {
  if (typeof fetches !== 'object') {
    return
  }
  const fetchKeys = Object.keys(fetches)
  if (fetchKeys.length === 0) {
    return
  }

  const { props, state } = apiConsumer
  const { apiContext } = props
  const { fetchedData } = state
  const { api, apiData: { jobs, reasons }, internalApi } = apiContext
  if (!api || !jobs || !internalApi) {
    return
  }

  fetchKeys.forEach((key) => {
    if (typeof props[key] !== 'undefined') {
      return
    }

    const fetch = createFetchObject(api, apiConsumer, fetches, key)
    if (!fetch) {
      return
    }

    const uniqueId = standardizeReqOptions(fetch)
    const job = jobs[uniqueId]
    if (!job ||
      !job._req ||
      job._req.method !== fetch.method ||
      job._req.uri !== fetch.uri) {
      return
    }

    if (reasons[uniqueId]) {
      const { error } = fetch
      fetchedData[key] = error ? error(reasons[uniqueId]) : {}
    } else {
      const { success } = fetch
      fetchedData[key] = success ? success(job) : job
    }
  })

  internalApi.log('useApiData -> fetchedData (keys): ', Object.keys(fetchedData))
}

const executeFetchesIfNeeded = (apiConsumer, eventName, fetches, onFetched) => {
  const notify = () => onFetched && onFetched()

  if (!fetches) {
    return notify()
  }

  const { props, state } = apiConsumer
  const { apiContext } = props
  const { fetchedData } = state
  const neededFetches = {}
  Object.keys(fetches).forEach((key) => {
    if (typeof props[key] !== 'undefined') {
      return
    }
    if (typeof fetchedData[key] !== 'undefined') {
      return
    }

    neededFetches[key] = fetches[key]
  })
  const neededKeys = Object.keys(neededFetches)
  if (neededKeys.length === 0) {
    return notify()
  }

  const { api, internalApi } = apiContext
  if (!api || !api[eventName] || typeof api[eventName] !== 'function' || !internalApi) {
    return notify()
  }
  const onEvent = api[eventName]
  internalApi.log('executeFetchesIfNeeded -> neededKeys', neededKeys)
  return onEvent(() => executeFetches(apiConsumer, api, neededFetches).then(notify))
}

const executeFetches = (apiConsumer, api, fetches) => {
  const promises = []
  const fetchedData = {}
  Object.keys(fetches).forEach((key) => {
    const fetch = createFetchObject(api, apiConsumer, fetches, key)
    if (!fetch) {
      return
    }

    const { error, success } = fetch
    promises.push(api.fetchOne(fetch)
      .then(success || (json => json), error || (() => ({})))
      .then((value) => (fetchedData[key] = value))
    )
  })

  return Promise.all(promises)
    .then(() => apiConsumer.setState((prevState) => (
      {
        fetchedData: {
          ...prevState.fetchedData,
          ...fetchedData
        }
      }
    )))
}

const hocApiConsumer = (Component) => {
  if (!Component) {
    throw new Error(errors.API_CONSUMER.REQUIRED_PARAM_MISSING)
  }

  class ApiConsumer extends React.Component {
    constructor (props) {
      super(props)
      this.cancelFetches = null
      this.cancelFetchesWithAuth = null

      const fetchedData = {}
      this.state = { fetchedData }

      const { apiFetches } = Component
      useApiData(this, apiFetches)
    }

    componentDidMount () {
      const { apiFetches, apiFetchesWithAuth } = Component
      const { onFetched, onFetchedWithAuth } = this.props
      this.cancelFetches = executeFetchesIfNeeded(this, 'onProviderMounted', apiFetches, onFetched)
      this.cancelFetchesWithAuth = executeFetchesIfNeeded(this, 'onAuthenticated', apiFetchesWithAuth, onFetchedWithAuth)
    }

    componentWillUnmount () {
      if (this.cancelFetches) {
        this.cancelFetches()
        this.cancelFetches = null
      }

      if (this.cancelFetchesWithAuth) {
        this.cancelFetchesWithAuth()
        this.cancelFetchesWithAuth = null
      }
    }

    render () {
      const { apiContext } = this.props
      const { api } = apiContext

      const props = { ...this.props }
      delete props.apiContext

      return <Component {...props} {...this.state.fetchedData} api={api} />
    }
  }

  const ApiContextConsumer = (props) => (
    <ApiContext.Consumer>
      {apiContext => <ApiConsumer {...props} apiContext={apiContext} />}
    </ApiContext.Consumer>
  )

  ApiContextConsumer.apiPreFetch = (api, element, queue) => {
    const fetches = Component.apiFetches
    if (typeof fetches !== 'object') {
      return
    }

    Object.keys(fetches).forEach((key) => {
      const fetch = createFetchObject(api, element, fetches, key)
      if (!fetch) {
        return
      }

      queue.push(fetch)
    })
  }

  return ApiContextConsumer
}

export default hocApiConsumer
