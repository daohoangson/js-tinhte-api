import React from 'react'
import { standardizeReqOptions } from 'tinhte-api'

import { ReactApi, ReactApiConsumerComponent, ReactApiConsumerFetch, ReactApiConsumerFetchOptions, ReactApiConsumerHoc, ReactApiConsumerProps, ReactApiContext, ReactApiPreFetch } from '../types'
import ApiContext from './ApiContext'

type _ApiConsumerCancelFetch = () => void

type _ApiConsumerPropsInternal = ReactApiConsumerProps & {
  apiContext: ReactApiContext
}

interface _ApiConsumerState {
  fetchedData: Record<string, any>
  cancelFetches?: _ApiConsumerCancelFetch
  cancelFetchesWithAuth?: _ApiConsumerCancelFetch
}

const createFetchObject = (api: ReactApi, element: React.Component, fetch: ReactApiConsumerFetch): ReactApiConsumerFetchOptions | undefined => {
  if (typeof fetch === 'function') {
    fetch = fetch(api, element.props)
  }

  if (
    typeof fetch !== 'object' ||
    typeof fetch.body !== 'undefined' ||
    typeof fetch.parseJson !== 'undefined'
  ) {
    return
  }

  return { ...fetch }
}

const useApiData = (apiConsumer: React.Component<_ApiConsumerPropsInternal, _ApiConsumerState>, fetches?: Record<string, ReactApiConsumerFetch>): void => {
  if (typeof fetches !== 'object') {
    return
  }
  const fetchKeys = Object.keys(fetches)
  if (fetchKeys.length === 0) {
    return
  }

  const { props, state: { fetchedData } } = apiConsumer
  const { apiContext: { api, apiData: { jobs, reasons = {} }, internalApi } } = props
  if (jobs === undefined) {
    return
  }

  const existing = props as Record<string, any>
  for (const key of fetchKeys) {
    if (typeof existing[key] !== 'undefined') {
      continue
    }

    const fetch = createFetchObject(api, apiConsumer, fetches[key])
    if (fetch == null) {
      continue
    }

    const uniqueId = standardizeReqOptions(fetch as any)
    const job = jobs[uniqueId]
    if (job === undefined ||
      job._req === undefined ||
      job._req.method !== fetch.method ||
      job._req.uri !== fetch.uri) {
      continue
    }

    const reason = reasons[uniqueId]
    if (typeof reason === 'string') {
      const { error } = fetch
      fetchedData[key] = error?.call(apiConsumer, new Error(reason)) ?? {}
    } else {
      const { success } = fetch
      fetchedData[key] = success?.call(apiConsumer, job) ?? job
    }
  }

  internalApi.log('useApiData -> fetchedData (keys): ', Object.keys(fetchedData))
}

const executeFetchesIfNeeded = (apiConsumer: React.Component<_ApiConsumerPropsInternal, _ApiConsumerState>, eventName: 'onAuthenticated' | 'onProviderMounted', fetches?: Record<string, ReactApiConsumerFetch>, onFetched?: () => void): _ApiConsumerCancelFetch | undefined => {
  const notify = (): void => onFetched?.call(apiConsumer)

  if (fetches == null) {
    notify()
    return
  }

  const { props: { apiContext } } = apiConsumer
  const { api, internalApi } = apiContext

  let isCancelled = false
  api[eventName](async () => {
    if (isCancelled) {
      internalApi.log('executeFetches has been cancelled')
      return
    }

    const { props, state } = apiConsumer
    const { fetchedData } = state
    const neededFetches: Record<string, ReactApiConsumerFetch> = {}
    const existing = props as Record<string, any>
    for (const key in fetches) {
      if (typeof existing[key] === 'undefined' &&
        typeof fetchedData[key] === 'undefined') {
        neededFetches[key] = fetches[key]
      }
    }

    const neededKeys = Object.keys(neededFetches)
    if (neededKeys.length === 0) {
      notify()
      return
    }

    internalApi.log('executeFetches...', neededKeys)
    await executeFetches(apiConsumer, api, neededFetches)
    notify()
  })

  const cancel: _ApiConsumerCancelFetch = () => {
    isCancelled = true
  }
  return cancel
}

const executeFetches = async (apiConsumer: React.Component<_ApiConsumerPropsInternal, _ApiConsumerState>, api: ReactApi, fetches: Record<string, ReactApiConsumerFetch>): Promise<void> => {
  const promises: Array<Promise<any>> = []
  const fetchedData: Record<string, any> = {}

  for (const key in fetches) {
    const fetch = createFetchObject(api, apiConsumer, fetches[key])
    if (fetch == null) {
      return
    }

    const { error, success } = fetch
    promises.push(api.fetchOne(fetch)
      .then(success ?? (json => json), error ?? (() => ({})))
      .then((value) => (fetchedData[key] = value))
    )
  }

  await Promise.all(promises)

  apiConsumer.setState((prevState) => (
    {
      ...prevState,
      fetchedData: {
        ...prevState.fetchedData,
        ...fetchedData
      }
    }
  ))
}

export const ConsumerHoc: ReactApiConsumerHoc = <P extends object>(Component: React.ComponentType<P> & ReactApiConsumerComponent) => {
  class ApiConsumer extends React.Component<P & _ApiConsumerPropsInternal, _ApiConsumerState> {
    constructor (props: P & _ApiConsumerPropsInternal) {
      super(props)

      const fetchedData = {}
      this.state = { fetchedData }

      const { apiFetches } = Component
      useApiData(this, apiFetches)
    }

    componentDidMount (): void {
      const { apiFetches, apiFetchesWithAuth } = Component
      const { onFetched, onFetchedWithAuth } = this.props
      this.setState((prevState) => ({
        ...prevState,
        cancelFetches: executeFetchesIfNeeded(this, 'onProviderMounted', apiFetches, onFetched),
        cancelFetchesWithAuth: executeFetchesIfNeeded(this, 'onAuthenticated', apiFetchesWithAuth, onFetchedWithAuth)
      }))
    }

    componentWillUnmount (): void {
      this.state.cancelFetches?.call(this)
      this.state.cancelFetchesWithAuth?.call(this)
    }

    render (): React.ReactElement {
      const { apiContext } = this.props
      const { api } = apiContext

      const props: any = { ...this.props }
      delete props.apiContext

      return <Component {...props} {...this.state.fetchedData} api={api} />
    }
  }

  const ApiContextConsumer = (props: P & ReactApiConsumerProps): React.ReactElement => (
    <ApiContext.Consumer>
      {apiContext => <ApiConsumer {...props} apiContext={apiContext} />}
    </ApiContext.Consumer>
  )

  const apiPreFetch: ReactApiPreFetch = (api, element, queue) => {
    const { apiFetches } = Component
    if (typeof apiFetches !== 'object') {
      return
    }

    for (const key in apiFetches) {
      const fetch = createFetchObject(api, element, apiFetches[key])
      if (fetch == null) {
        return
      }

      queue.push(fetch)
    }
  }

  ApiContextConsumer.apiPreFetch = apiPreFetch

  return ApiContextConsumer
}
