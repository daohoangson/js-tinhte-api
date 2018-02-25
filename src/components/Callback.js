import React from 'react'
import querystring from 'querystring'

const attemptToPostMessage = () => {
  if (typeof window === 'undefined' ||
      typeof window.location === 'undefined' ||
      typeof window.top === 'undefined') {
    return 'window'
  }

  const h = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  if (!h.access_token) {
    return 'access_token'
  }

  window.top.postMessage({
    auth: h
  }, window.location.origin)

  return 'success'
}

const Callback = ({internalApi}) => {
  const result = attemptToPostMessage()
  if (!internalApi.getDebug()) {
    return <span className='Callback' />
  }

  return <span className='Callback' data-result={result} />
}

export default Callback
