import React from 'react'
import PropTypes from 'prop-types'

import { isPlainObject } from '../helpers'
import errors from '../helpers/errors'
import standardizeReqOptions from '../helpers/standardizeReqOptions'

const executeFetches = (apiConsumer, api, fetches) => {
  const promises = []
  const fetchedData = {}
  Object.keys(fetches).forEach((key) => {
    let fetch = fetches[key]
    if (typeof fetch === 'function') {
      fetch = fetch(api)
    }
    if (!isPlainObject(fetch)) {
      return
    }

    const { uri, method, headers, body, success, error } = fetch
    let promise = api.fetchOne(uri, method, headers, body)

    promise = promise.catch(error || (() => ({})))
    if (success) {
      promise = promise.then(success)
    }

    promise = promise.then((value) => (fetchedData[key] = value))

    promises.push(promise)
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

const useApiData = (apiConsumer, fetches) => {
  const { api, apiData, internalApi } = apiConsumer.context
  if (!isPlainObject(api) ||
    !isPlainObject(apiData) ||
    !isPlainObject(internalApi)) {
    return false
  }

  const foundJobs = {}
  const fetchKeys = Object.keys(fetches)
  fetchKeys.forEach((key) => {
    let fetch = fetches[key]
    if (typeof fetch === 'function') {
      fetch = fetch(api)
    }
    if (!isPlainObject(fetch)) {
      return
    }

    const reqOptions = { ...fetch }
    const uniqueId = standardizeReqOptions(reqOptions)
    const job = apiData[uniqueId]

    if (!isPlainObject(job) ||
      !isPlainObject(job._req) ||
      job._req.method !== reqOptions.method ||
      job._req.uri !== reqOptions.uri ||
      typeof job._job_result !== 'string' ||
      job._job_result !== 'ok') {
      return
    }

    foundJobs[key] = job
  })

  if (Object.keys(foundJobs).length !== fetchKeys.length) {
    return false
  }

  const fetchedData = {}
  fetchKeys.forEach((key) => {
    const { success } = fetches[key]
    fetchedData[key] = success ? success(foundJobs[key]) : foundJobs[key]
  })

  apiConsumer.setState(() => ({fetchedData}))
  return true
}

const executeFetchesIfNeeded = (apiConsumer, eventName, fetches, onFetched) => {
  const notify = () => onFetched && onFetched()

  if (!isPlainObject(fetches) ||
    useApiData(apiConsumer, fetches)) {
    return notify()
  }

  const { api } = apiConsumer.context
  if (!isPlainObject(api)) {
    return notify()
  }

  const onEvent = api[eventName]
  return onEvent(() => executeFetches(apiConsumer, api, fetches).then(notify))
}

const hocApiConsumer = (Component) => {
  if (!Component) {
    throw new Error(errors.API_CONSUMER.REQUIRED_PARAM_MISSING)
  }

  class ApiConsumer extends React.Component {
    constructor (props, context) {
      super(props, context)
      this.cancelFetches = null
      this.cancelFetchesWithAuth = null

      const fetchedData = {}
      this.state = {fetchedData}
    }

    componentWillMount () {
      const eventName = 'onProviderMounted'
      const { apiFetches } = Component
      const { onFetched } = this.props
      this.cancelFetches = executeFetchesIfNeeded(this, eventName, apiFetches, onFetched)
    }

    componentDidMount () {
      const eventName = 'onAuthenticated'
      const { apiFetchesWithAuth } = Component
      const { onFetchedWithAuth } = this.props
      this.cancelFetchesWithAuth = executeFetchesIfNeeded(this, eventName, apiFetchesWithAuth, onFetchedWithAuth)
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
      return <Component api={this.context.api} {...this.state.fetchedData} {...this.props} />
    }
  }

  ApiConsumer.contextTypes = {
    api: PropTypes.object,
    apiData: PropTypes.object,
    internalApi: PropTypes.object
  }

  return ApiConsumer
}

export default hocApiConsumer
