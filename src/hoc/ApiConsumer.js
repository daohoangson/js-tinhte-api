import React from 'react'

import { isPlainObject } from '../helpers'
import errors from '../helpers/errors'
import { createFetchObject } from '../helpers/fetchApiDataForProvider'
import standardizeReqOptions from '../helpers/standardizeReqOptions'
import ApiContext from './ApiContext'

const executeFetches = (apiConsumer, api, fetches) => {
  const promises = []
  const fetchedData = {}
  Object.keys(fetches).forEach((key) => {
    const fetch = createFetchObject(api, apiConsumer, fetches, key)
    if (!isPlainObject(fetch)) {
      return
    }

    let promise = api.fetchOne(fetch)

    const { error, success } = fetch
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
  const { apiContext } = apiConsumer.props
  const { api, apiData, internalApi } = apiContext
  if (!isPlainObject(api) ||
    !isPlainObject(apiData) ||
    !isPlainObject(internalApi)) {
    return false
  }

  const foundJobs = {}
  const fetchKeys = Object.keys(fetches)
  fetchKeys.forEach((key) => {
    const fetch = createFetchObject(api, apiConsumer, fetches, key)
    if (!isPlainObject(fetch)) {
      foundJobs[key] = {}
      return
    }

    const uniqueId = standardizeReqOptions(fetch)
    const job = apiData[uniqueId]

    if (!isPlainObject(job) ||
      !isPlainObject(job._req) ||
      job._req.method !== fetch.method ||
      job._req.uri !== fetch.uri ||
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

  const { apiContext } = apiConsumer.props
  const { api } = apiContext
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
    constructor (props) {
      super(props)
      this.cancelFetches = null
      this.cancelFetchesWithAuth = null

      const fetchedData = {}
      this.state = {fetchedData}
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

      const props = {...this.props}
      delete props.apiContext

      return <Component {...this.state.fetchedData} {...props} api={api} />
    }
  }

  class ApiContextConsumer extends React.Component {
    constructor (props) {
      super(props)

      this.state = {isMounted: false}
    }

    componentDidMount () {
      this.setState(() => ({isMounted: true}))
    }

    render () {
      if (!this.state.isMounted) {
        return <Component {...this.props} />
      }

      return (
        <ApiContext.Consumer>
          {apiContext => <ApiConsumer {...this.props} apiContext={apiContext} />}
        </ApiContext.Consumer>
      )
    }
  }

  return ApiContextConsumer
}

export default hocApiConsumer
