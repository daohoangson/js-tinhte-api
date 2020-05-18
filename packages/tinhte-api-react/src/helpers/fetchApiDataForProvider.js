import ssrPrepass from 'react-ssr-prepass'

const fetchApiDataForProvider = (api, internalApi, rootElement) => {
  const queue = []

  return ssrPrepass(rootElement, (element) => {
    if (element && element.type && typeof element.type.apiPreFetch === 'function') {
      element.type.apiPreFetch(api, element, queue)
    }
  })
    .then(() => {
      internalApi.log('fetchApiDataForProvider queue.length = %d', queue.length)

      if (queue.length === 0) {
        return {}
      }

      const fetches = () => queue.forEach(
        (o, i) => api.fetchOne(o)
          .catch((reason) => internalApi.log('fetchApiDataForProvider queue[%d] has been rejected (%s)', i, reason))
      )
      return api.fetchMultiple(fetches)
    })
    .then((json) => json && json.jobs ? json.jobs : {})
}

export default fetchApiDataForProvider
