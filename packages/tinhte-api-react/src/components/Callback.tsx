import React from 'react'
import { parse } from 'querystring'
import { ReactApi, ReactApiInternal } from '../types'

export function processCallback (log?: (...args: any[]) => void): boolean {
  const hash = window.location?.hash?.replace(/^#/, '') ?? ''
  const auth = parse(hash)

  if (typeof auth.state !== 'string') {
    log?.call(window, 'Couldn\'t extract state from %s', window.location?.href ?? 'N/A')
    return false
  }

  window.top.postMessage({ auth }, window.location.origin)
  log?.call(window, 'Forwarded auth to window.top')

  return true
}

export const Callback = (props: { api: ReactApi, internalApi: ReactApiInternal }): React.ReactElement => {
  const { api, internalApi } = props
  const success = processCallback(internalApi.log)

  if (!api.getDebug()) {
    return <span className='ApiCallback' />
  }

  return <span className='ApiCallback' data-success={success} />
}
