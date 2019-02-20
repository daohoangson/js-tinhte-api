import React from 'react'
import querystring from 'querystring'

import { mustBePlainObject } from '../helpers'

const processCallback = (log) => {
  let auth = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  auth = mustBePlainObject(auth)
  if (!auth.state) {
    log && log('Couldn\'t extract state from %s', window.location.href)
    return false
  }

  window.top.postMessage({ auth }, window.location.origin)
  log && log('Forwarded auth to window.top')

  return true
}

const Callback = ({ api }) => {
  let success = false

  /* istanbul ignore else */
  if (process.browser) {
    success = processCallback(function () {
      return api._log(arguments)
    })
  }

  if (!api.getDebug()) {
    return <span className='ApiCallback' />
  }

  return <span className='ApiCallback' data-success={success} />
}

export { processCallback }

export default Callback
