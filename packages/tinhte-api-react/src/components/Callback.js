import React from 'react'
import querystring from 'querystring'

const processCallback = (log) => {
  const auth = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
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
  if (!api.getDebug()) {
    return <span className='ApiCallback' />
  }

  const success = processCallback(internalApi.log)
  return <span className='ApiCallback' data-success={success} />
}

export { processCallback }

export default Callback
