import React from 'react'
import { standardizeReqOptions } from 'tinhte-api'

import { ReactApi, ReactApiConsumerComponent, ReactApiConsumerFetch, ReactApiConsumerFetchOptions, ReactApiConsumerHoc, ReactApiConsumerProps, ReactApiContext, ReactApiPreFetch } from '../types'
import ApiContext from './ApiContext'

type _ApiConsumerCancelFetch = () => void

type _ApiConsumerPropsInternal = ReactApiConsumerProps & {
  apiContext: ReactApiContext
}

type _FetchedData = Record<string, any>

type _FetchedDataSetter = React.Dispatch<React.SetStateAction<_FetchedData>>

const createFetchObject = (api: ReactApi, props: object, fetch: ReactApiConsumerFetch): ReactApiConsumerFetchOptions | undefined => {
  while (typeof fetch === 'function') {
    fetch = fetch(api, props)
  }

  if (
    fetch === null ||
    fetch === undefined ||
    typeof fetch !== 'object' ||
    (fetch.body !== null && fetch.body !== undefined) ||
    fetch.parseJson !== undefined
  ) {
    return
  }

  return { ...fetch }
}

const useApiData = (props: _ApiConsumerPropsInternal, fetches?: Record<string, ReactApiConsumerFetch>): _FetchedData | undefined => {
  if (typeof fetches !== 'object') {
    return
  }
  const fetchKeys = Object.keys(fetches)
  if (fetchKeys.length === 0) {
    return
  }

  const { apiContext: { api, apiData: { jobs, reasons = {} }, internalApi } } = props
  if (api === undefined || jobs === undefined) {
    return
  }

  const existing = props as Record<string, any>
  const propsData: _FetchedData = {}
  for (const key of fetchKeys) {
    if (existing[key] !== undefined) {
      continue
    }

    const fetch = createFetchObject(api, props, fetches[key])
    if (fetch === undefined) {
      continue
    }

    const uniqueId = standardizeReqOptions(fetch as any)
    if (uniqueId === undefined) {
      continue
    }

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
      propsData[key] = typeof error === 'function' ? error(new Error(reason)) : {}
    } else {
      const { success } = fetch
      propsData[key] = typeof success === 'function' ? success(job) : job
    }
  }

  const keys = Object.keys(propsData)
  if (keys.length > 0) {
    internalApi?.log('useApiData -> keys', keys)
    return propsData
  }
}

const executeFetchesIfNeeded = (props: _ApiConsumerPropsInternal, propsData: _FetchedData, setData: _FetchedDataSetter, eventName: 'onAuthenticated' | 'onProviderMounted', fetches?: Record<string, ReactApiConsumerFetch>, onFetched?: () => void): _ApiConsumerCancelFetch | undefined => {
  const notify = (): void => {
    if (typeof onFetched === 'function') {
      onFetched()
    }
  }

  if (fetches === undefined) {
    notify()
    return
  }

  const { apiContext: { api, internalApi } } = props
  if (api === undefined) {
    notify()
    return
  }

  let isCancelled = false
  api[eventName](async () => {
    if (isCancelled) {
      internalApi?.log('executeFetches has been cancelled')
      return
    }

    const neededFetches: Record<string, ReactApiConsumerFetch> = {}
    const existing = props as Record<string, any>
    for (const key in fetches) {
      if (existing[key] === undefined && propsData[key] === undefined) {
        neededFetches[key] = fetches[key]
      }
    }

    const neededKeys = Object.keys(neededFetches)
    if (neededKeys.length === 0) {
      notify()
      return
    }

    internalApi?.log('executeFetches...', neededKeys)
    await executeFetches(props, setData, neededFetches)
    notify()
  })

  const cancel: _ApiConsumerCancelFetch = () => {
    isCancelled = true
  }
  return cancel
}

const executeFetches = async (props: _ApiConsumerPropsInternal, setData: _FetchedDataSetter, fetches: Record<string, ReactApiConsumerFetch>): Promise<void> => {
  const { apiContext: { api } } = props
  if (api === undefined) {
    return
  }

  const promises: Array<Promise<any>> = []
  const fetchedData: Record<string, any> = {}

  for (const key in fetches) {
    const fetch = createFetchObject(api, props, fetches[key])
    if (fetch === undefined) {
      continue
    }

    const { error, success } = fetch
    promises.push(api.fetchOne(fetch)
      .then(success ?? (json => json), error ?? (() => ({})))
      .then((value) => (fetchedData[key] = value))
    )
  }

  if (promises.length === 0) {
    return
  }
  await Promise.all(promises)

  if (Object.keys(fetchedData).length === 0) {
    return
  }
  setData((prev) => ({ ...prev, ...fetchedData }))
}

export const ApiConsumer: ReactApiConsumerHoc = <P extends object>(Component: React.ComponentType<P> & ReactApiConsumerComponent) => {
  const ApiConsumer = (props: P & _ApiConsumerPropsInternal): React.ReactElement => {
    const { apiFetches } = Component
    const [data, setData] = React.useState<_FetchedData>({})

    React.useEffect(() => {
      const propsData = useApiData(props, apiFetches) ?? data
      setData(propsData)

      const { apiFetchesWithAuth } = Component
      const { onFetched, onFetchedWithAuth } = props
      const cancelFetches = executeFetchesIfNeeded(props, propsData, setData, 'onProviderMounted', apiFetches, onFetched)
      const cancelFetchesWithAuth = executeFetchesIfNeeded(props, propsData, setData, 'onAuthenticated', apiFetchesWithAuth, onFetchedWithAuth)

      return () => {
        if (cancelFetches !== undefined) cancelFetches()
        if (cancelFetchesWithAuth !== undefined) cancelFetchesWithAuth()
      }
    }, [])

    const { apiContext: { api }, ...componentProps } = props
    return <Component {...(componentProps as P)} {...data} api={api} />
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

    const { props } = element
    for (const key in apiFetches) {
      const fetch = createFetchObject(api, props, apiFetches[key])
      if (fetch === undefined) {
        return
      }

      queue.push(fetch)
    }
  }

  ApiContextConsumer.apiPreFetch = apiPreFetch

  return ApiContextConsumer
}
