import React from 'react'
import { parse } from 'querystring'

const processCallback = (log) => {
  /* istanbul ignore else */
  if (!process.browser) {
    return false
  }

  const auth = window.location.hash
    ? parse(window.location.hash.replace(/^#/, ''))
    : false
  if (!auth || !auth.state) {
    log && log('Couldn\'t extract state from %s', window.location.href)
    return false
  }

  window.top.postMessage({ auth }, window.location.origin)
  log && log('Forwarded auth to window.top')

  return true
}

const Callback = ({ api, internalApi }) => {
  const log = api.getDebug() ? internalApi.log : null
  const success = processCallback(log)

  if (!api.getDebug()) {
    return <span className='ApiCallback' />
  }

  return <span className='ApiCallback' data-success={success} />
}

export { processCallback }

export default Callback
