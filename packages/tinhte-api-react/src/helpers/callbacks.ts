import { FetchMultipleOptions } from 'tinhte-api/src/fetches/types'
import { ReactApi, ReactApiInternal } from '../types'

const waitABitThen = (callback: () => any): void => {
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback)
  } else {
    setTimeout(callback, 0)
  }
}

interface Callbacks {
  add: (list: CallbackList, callback: CallbackCallback, triggerNow: boolean) => CallbackCallback
  fetchItems: (items: CallbackCallback[], options?: FetchMultipleOptions) => Promise<any>
  fetchList: (list: CallbackList) => Promise<number>
}

type CallbackCallback = () => void

interface CallbackList {
  name: string
  items: CallbackCallback[]
}

export default (api: ReactApi, internalApi: ReactApiInternal): Callbacks => {
  const sharedItems: CallbackCallback[] = []
  const sharedResolves: CallbackCallback[] = []

  const callbacks: Callbacks = {
    add: (list, callback, triggerNow) => {
      const { items } = list
      items.push(callback)
      internalApi.log('Added new %s callback, total=%d', list.name, items.length)

      if (triggerNow) {
        // eslint-disable-next-line
        callbacks.fetchList(list)
      }

      return () => {
        const i = items.indexOf(callback)
        if (i < 0) {
          return false
        }

        items.splice(i, 1)
        internalApi.log('Removed %s callback #%d, remaining=%d', list.name, i, items.length)
        return true
      }
    },

    fetchItems: async (items, options = {}) => {
      if (items.length === 0) {
        return []
      }

      return await api.fetchMultiple(
        () => {
          for (const callback of items) {
            callback()
          }
          internalApi.log('Triggered %d callbacks', items.length)

          items.length = 0
        },
        options
      ).catch(() => [])
    },

    fetchList: async (list) => {
      const { items } = list
      const callbackCount = items.length

      const promise = new Promise<number>((resolve) => {
        for (const callback of items) {
          sharedItems.push(callback)
        }
        sharedResolves.push(() => resolve(callbackCount))

        const sharedItemsLength = sharedItems.length
        waitABitThen(async () => {
          if (sharedItems.length !== sharedItemsLength) {
            // another invocation has altered the shared queue,
            // stop running now and let that handle the fetch
            return
          }

          await callbacks.fetchItems(sharedItems)
          for (const callback of sharedResolves) {
            callback()
          }
          sharedResolves.length = 0
        })

        items.length = 0
      })

      return await promise
    }
  }

  return callbacks
}
