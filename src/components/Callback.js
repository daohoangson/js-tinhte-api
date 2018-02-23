import querystring from 'querystring'

const attemptToPostMessage = () => {
  if (typeof window === 'undefined' ||
      typeof window.location === 'undefined' ||
      typeof window.top === 'undefined') {
    return false
  }

  const s = window.location.search
    ? querystring.parse(window.location.search.replace(/^\?/, ''))
    : {}
  if (!s.targetOrigin) {
    return false
  }

  const h = window.location.hash
    ? querystring.parse(window.location.hash.replace(/^#/, ''))
    : {}
  if (!h.access_token) {
    return false
  }

  window.top.postMessage({
    auth: h
  }, s.targetOrigin)

  return true
}

const Callback = () => {
  attemptToPostMessage()
  return null
}

export default Callback
