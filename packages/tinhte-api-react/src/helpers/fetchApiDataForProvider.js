import ssrPrepass from 'react-ssr-prepass'
import { standardizeReqOptions } from 'tinhte-api'

const fetchApiDataForProvider = (api, internalApi, rootElement) => {
  const queue = []
  const reasons = {}

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
        (fetch, i) => api.fetchOne(fetch)
          .catch((reason) => {
            const uniqueId = standardizeReqOptions(fetch)
            internalApi.log('fetchApiDataForProvider queue[%d] has been rejected (%s, %s)', i, uniqueId, reason)
            reasons[uniqueId] = reason
          })
      )
      return api.fetchMultiple(fetches)
    })
    .then((json) => {
      const jobs = json && json.jobs ? json.jobs : {}
      return { jobs, reasons }
    })
}

export default fetchApiDataForProvider
