import React from 'react'
import querystring from 'querystring'

const processCallback = (log) => {
  const auth = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  if (!auth.access_token) {
    log && log('Couldn\'t extract access_token from %s', window.location.href)
    return false
  }

  window.top.postMessage({auth}, window.location.origin)
  log && log('Forwarded auth to window.top')

  return true
}

const Callback = ({api, internalApi}) => {
  const success = process.browser ? processCallback(internalApi.log) : false

  if (!api.getDebug()) {
    return <span className='ApiCallback' />
  }

  return <span className='ApiCallback' data-success={success} />
}

export { processCallback }

export default Callback
