import React from 'react'
import querystring from 'querystring'

const attemptToPostMessage = () => {
  if (typeof window === 'undefined' ||
      typeof window.location === 'undefined' ||
      typeof window.top === 'undefined') {
    return 'window'
  }

  const s = window.location.search
    ? querystring.parse(window.location.search.replace(/^\?/, ''))
    : {}
  if (!s.targetOrigin) {
    return 'targetOrigin'
  }

  const h = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  if (!h.access_token) {
    return 'access_token'
  }

  window.top.postMessage({
    auth: h
  }, s.targetOrigin)

  return 'success'
}

const Callback = () => {
  const result = attemptToPostMessage()
  return <span className='Callback' data-result={result} />
}

export default Callback
