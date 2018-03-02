import React from 'react'
import PropTypes from 'prop-types'

const executeFetches = (apiConsumer, fetches) => {
  const promises = []
  const apiData = {}
  Object.keys(fetches).forEach((key) => {
    const { uri, method, headers, body, success, error } = fetches[key]
    let promise = apiConsumer.context.api.fetchOne(uri, method, headers, body)

    promise = promise.catch(error || (() => ({})))
    if (success) {
      promise = promise.then(success)
    }

    promise = promise.then((value) => (apiData[key] = value))

    promises.push(promise)
  })

  return Promise.all(promises)
    .then(() => apiConsumer.setState((prevState) => {
      const { prevApiData } = prevState
      const newApiData = {...prevApiData, ...apiData}
      return {apiData: newApiData}
    }))
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

  const newApiData = {}
  fetchKeys.forEach((key) => {
    const { success } = fetches[key]
    newApiData[key] = success ? success(foundJobs[key]) : foundJobs[key]
  })

  apiConsumer.setState(() => ({apiData: newApiData}))
  return true
}

const hocApiConsumer = (Component) => {
  class ApiConsumer extends React.Component {
    constructor (props, context) {
      super(props, context)
      this.cancelFetches = null
      this.cancelFetchesWithAuth = null
      this.state = {apiData: {}}
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
      const props = {
        api: this.context.api,

        ...this.props
      }

      if (this.state.apiData !== null) {
        props.apiData = this.state.apiData
      }

      return <Component {...props} />
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
