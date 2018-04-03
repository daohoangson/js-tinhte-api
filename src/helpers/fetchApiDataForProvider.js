import reactTreeWalker from 'react-tree-walker'

const fetchApiDataForProvider = (api, internalApi, rootElement) => {
  const queue = []

  return reactTreeWalker(rootElement, (element) => {
    if (element && element.type && typeof element.type.apiPreFetch === 'function') {
      element.type.apiPreFetch(api, element, queue)

      // react-tree-walker@4.0.2 haven't added support for React 16.3 Context API
      // (that means it cannot reach ReactContext.Consumer's function-as-a-child)
      // we are returning `false ` here to make that dependable
      return false
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
