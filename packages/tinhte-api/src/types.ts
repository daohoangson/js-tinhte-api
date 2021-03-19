import { FetchHeaders, FetchMultiple, FetchOne } from './fetches/types'

export interface Api {
  fetchMultiple: FetchMultiple
  batch: FetchMultiple
  fetchOne: FetchOne
  del: FetchOne
  get: FetchOne
  post: FetchOne
  put: FetchOne
  login: (clientSecret: string, username: string, password: string) => Promise<any>
  refreshToken: (clientSecret: string, refreshToken: string) => Promise<any>

  clone: (config: ApiConfig) => Api
  generateOneTimeToken: (clientSecret: string, ttl: Date | number) => string
  getAccessToken: () => string
  getApiRoot: () => string
  getAuth: () => ApiAuth
  getCallbackUrl: () => string
  getClientId: () => string
  getCookiePrefix: () => string
  getDebug: () => boolean
  getFetchCount: () => number
  getOtt: () => string
  getScope: () => string
  getHeaders: () => FetchHeaders
  getUniqueId: () => string
  getUserId: () => number
  hasAuth: () => boolean
  updateConfig: (config: ApiConfig) => void
}

export interface ApiAuth {
  accessToken?: string
  userId?: number
  _xf1?: any
  _xf2?: any
}

export interface ApiConfig {
  apiRoot?: string
  auth?: ApiAuth
  callbackUrl?: string
  clientId?: string
  cookiePrefix?: string
  debug?: boolean
  ott?: string
  scope?: string
  headers?: FetchHeaders
}

export interface ApiInternal {
  log: (...args: any[]) => boolean
}
