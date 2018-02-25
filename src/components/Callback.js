import React from 'react'
import querystring from 'querystring'

const attemptToPostMessage = (internalApi) => {
  if (typeof window === 'undefined' ||
      typeof window.location === 'undefined' ||
      typeof window.top === 'undefined') {
    internalApi.log('Couldn\'t detect browser env')
    return false
  }

  const auth = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  if (!auth.access_token) {
    internalApi.log('Couldn\'t extract access_token from %s', window.location.href)
    return false
  }

  window.top.postMessage({auth}, window.location.origin)
  internalApi.log('Forwarded auth to window.top')

  return true
}

const Callback = ({internalApi}) => {
  const success = attemptToPostMessage(internalApi)
  return <span className='ApiCallback' data-success={success} />
}

export default Callback
