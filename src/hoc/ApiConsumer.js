import React from 'react'
import PropTypes from 'prop-types'

const executeFetches = (apiConsumer, fetches) => {
  const promises = []
  const fetchedData = {}
  Object.keys(fetches).forEach((key) => {
    const { uri, method, headers, body, success, error } = fetches[key]
    let promise = apiConsumer.context.api.fetchOne(uri, method, headers, body)

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
  const { apiData, internalApi } = apiConsumer.context

  const foundJobs = {}
  const fetchKeys = Object.keys(fetches)
  fetchKeys.forEach((key) => {
    const reqOptions = { ...fetches[key] }
    const uniqueId = internalApi.standardizeReqOptions(reqOptions)
    if (typeof apiData[uniqueId] !== 'object') {
      return
    }

    const job = apiData[uniqueId]
    if (typeof job._req !== 'object' ||
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

  if (fetches === null || typeof fetches !== 'object') {
    return notify()
  }

  if (useApiData(apiConsumer, fetches)) {
    return notify()
  }

  const { internalApi } = apiConsumer.context
  const onEvent = internalApi[eventName]
  return onEvent(() => executeFetches(apiConsumer, fetches).then(notify))
}

const hocApiConsumer = (Component) => {
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
      this.cancelFetches = executeFetchesIfNeeded(this, eventName, apiFetchesWithAuth, onFetchedWithAuth)
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
