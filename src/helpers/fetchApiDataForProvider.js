import reactTreeWalker from 'react-tree-walker'

import { isPlainObject } from '.'

export const createFetchObject = (api, element, fetches, key) => {
  let fetch = fetches[key]
  if (typeof fetch === 'function') {
    fetch = fetch(api, element.props)
  }
  if (!isPlainObject(fetch)) {
    return null
  }

  return {...fetch}
}

const fetchApiDataForProvider = (api, internalApi, rootElement) => {
  const queue = []

  const enqueueFetches = (element, fetches) => {
    Object.keys(fetches).forEach((key) => {
      const fetch = createFetchObject(api, element, fetches, key)
      if (!isPlainObject(fetch)) {
        return
      }

      queue.push(fetch)
    })
  }

  return reactTreeWalker(rootElement, (element) => {
    if (element && element.type && element.type.apiFetches) {
      enqueueFetches(element, element.type.apiFetches)
    }

    return true
  })
    .then(() => {
      internalApi.log('fetchApiDataForProvider queue.length = %d', queue.length)

      if (queue.length === 0) {
        return {}
      }

      const fetches = () => queue.forEach((o) => api.fetchOne(o))
      return api.fetchMultiple(fetches)
    })
    .then((json) => json && json.jobs ? json.jobs : {})
}

export default fetchApiDataForProvider
