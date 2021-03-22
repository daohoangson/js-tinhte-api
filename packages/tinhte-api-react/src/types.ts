import React from 'react'
import { FetchMultipleJobs, FetchOptions } from 'tinhte-api/src/fetches/types'
import { Api, ApiConfig } from 'tinhte-api/src/types'

export type ReactApi = Api & {
  CallbackComponent: () => React.ReactElement
  ConsumerHoc: ReactApiConsumerHoc
  ProviderHoc: ReactApiProviderHoc

  clone: (config: ApiConfig) => ReactApi

  fetchApiDataForProvider: (rootElement: React.ReactNode) => Promise<ReactApiData>

  onAuthenticated: (callback: () => any) => void

  onProviderMounted: (callback: () => any) => void
}

export interface ReactApiAuth {
  access_token?: string
  state?: string
  user_id?: number | string
}

export type ReactApiConsumerHoc = <P extends object>(Component: React.ComponentType<P> & ReactApiConsumerComponent)
=> React.FunctionComponent<P & ReactApiConsumerProps>

export interface ReactApiConsumerComponent {
  apiFetches?: Record<string, ReactApiConsumerFetch>
  apiFetchesWithAuth?: Record<string, ReactApiConsumerFetch>
}

export type ReactApiConsumerFetch = ReactApiConsumerFetchOptions | ReactApiConsumerFetchOptionsBuilder | undefined
export type ReactApiConsumerFetchOptions = FetchOptions & {
  error?: (reason?: any) => any
  success?: (json: object) => any
}
export type ReactApiConsumerFetchOptionsBuilder = (api: Api, props: object) => ReactApiConsumerFetchOptions | undefined

export interface ReactApiConsumerProps {
  onFetched?: () => void
  onFetchedWithAuth?: () => void
}

export interface ReactApiContext {
  api: ReactApi
  apiData: ReactApiData
  internalApi: ReactApiInternal
}

export interface ReactApiData {
  jobs?: FetchMultipleJobs
  reasons?: Record<string, string>
}

export interface ReactApiInternal {
  LoaderComponent: () => React.ReactElement
  log: (...args: any[]) => boolean
  setAuth: (newAuth?: ReactApiAuth) => void
  setProviderMounted: () => void
}

export type ReactApiPreFetch = (api: ReactApi, element: React.Component, queue: FetchOptions[]) => void

export type ReactApiProviderHoc = <P extends object>(Component: React.ComponentType<P>)
=> React.ComponentType<P & ReactApiProviderProps>

export interface ReactApiProviderProps {
  apiConfig?: ApiConfig
  apiData?: ReactApiData
}
