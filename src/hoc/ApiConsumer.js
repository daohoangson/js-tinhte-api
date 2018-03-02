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

const attemptToUseApiData = (apiConsumer, fetches) => {
  const { apiData, internalApi } = apiConsumer.context
  if (apiData === null ||
    typeof apiData !== 'object' ||
    typeof apiData.jobs !== 'object') {
    return false
  }

  const { jobs } = apiData
  const foundJobs = {}
  const fetchKeys = Object.keys(fetches)
  fetchKeys.forEach((key) => {
    const reqOptions = { ...fetches[key] }
    const uniqueId = internalApi.standardizeReqOptions(reqOptions)
    if (typeof jobs[uniqueId] !== 'object') {
      return
    }

    const job = jobs[uniqueId]
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
      const { api, internalApi } = this.context
      if (typeof api !== 'object' ||
        typeof internalApi !== 'object') {
        return
      }

      if (typeof Component.apiFetches === 'object' &&
        this.cancelFetches === null) {
        if (!attemptToUseApiData(this, Component.apiFetches)) {
          this.cancelFetches = internalApi.onProviderMounted(
            () => executeFetches(this, Component.apiFetches)
              .then(() => {
                const { onFetched } = this.props
                return onFetched ? onFetched() : false
              })
          )
        }
      }
    }

    componentDidMount () {
      const { api, internalApi } = this.context
      if (typeof api !== 'object' ||
        typeof internalApi !== 'object') {
        return
      }

      if (typeof Component.apiFetchesWithAuth === 'object' &&
        this.cancelFetchesWithAuth === null) {
        this.cancelFetchesWithAuth = internalApi.onAuthenticated(
          () => executeFetches(this, Component.apiFetchesWithAuth)
            .then(() => {
              const { onFetchedWithAuth } = this.props
              return onFetchedWithAuth ? onFetchedWithAuth() : false
            })
        )
      }
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
