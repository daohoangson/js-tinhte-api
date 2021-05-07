import React from 'react'
import ssrPrepass from 'react-ssr-prepass'
import { standardizeReqOptions } from 'tinhte-api'
import { FetchOptions } from 'tinhte-api/src/fetches/types'
import { ReactApi, ReactApiData, ReactApiInternal, ReactApiPreFetch } from '../types'

export async function fetchApiDataForProvider (api: ReactApi, internalApi: ReactApiInternal, rootElement: React.ReactNode): Promise<ReactApiData> {
  const queue: FetchOptions[] = []
  const reasons: Record<string, string> = {}

  await ssrPrepass(rootElement, (element: any, instance) => {
    if (element.type !== undefined) {
      const { apiPreFetch } = element.type as { apiPreFetch?: ReactApiPreFetch }
      if (typeof apiPreFetch === 'function') {
        apiPreFetch(api, instance ?? element, queue)
      }
    }
  })

  internalApi.log('fetchApiDataForProvider queue.length = %d', queue.length)

  if (queue.length === 0) {
    return { jobs: {}, reasons }
  }

  const json = await api.fetchMultiple(() => {
    for (let i = 0; i < queue.length; i++) {
      const uniqueId = standardizeReqOptions(fetch as any)
      if (uniqueId === undefined) {
        continue
      }

      api.fetchOne(queue[i])
        .catch((reason) => {
          internalApi.log('fetchApiDataForProvider queue[%d] has been rejected (%s, %s)', i, uniqueId, reason)
          reasons[uniqueId] = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : JSON.stringify(reason)
        })
    }
  })

  return { jobs: json?.jobs, reasons }
}
