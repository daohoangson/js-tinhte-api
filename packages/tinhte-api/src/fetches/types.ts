import { StandardizedFetchOptions } from '../helpers/standardizeReqOptions'

export type FetchHeaders = Record<string, string>

export type FetchJson = (options: StandardizedFetchOptions) => Promise<any>

export type FetchOne = (input: FetchOptions | string) => Promise<any>

export interface FetchOptions {
  body?: BodyInit | null
  method?: string
  headers?: FetchHeaders
  params?: FetchParams
  parseJson?: boolean
  uri?: string
}

export type FetchMultiple = (fetches: () => void, options?: FetchMultipleOptions) => Promise<any>

export interface FetchMultipleJob {
  _job_error?: string
  _job_result?: string
  _req?: {
    method: string
    uri: string
  }
}

export interface FetchMultipleJobs {
  [key: string]: FetchMultipleJob
}

export interface FetchMultipleOptions {
  triggerHandlers?: boolean
}

export type FetchParams = Record<string, string | string[]>

export interface Fetches {
  fetchOne: FetchOne
  fetchMultiple: FetchMultiple
  getFetchCount: () => number
}
