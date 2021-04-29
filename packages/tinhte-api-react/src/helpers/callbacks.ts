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
        callbacks.fetchList(list).then(
          (_) => {},
          () => { /* ignore errors */ }
        )
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
        },
        options
      ).catch(() => [])
    },

    fetchList: async (list) => {
      const items = [...list.items]
      list.items.length = 0

      const promise = new Promise<number>((resolve) => {
        for (const callback of items) {
          sharedItems.push(callback)
        }
        sharedResolves.push(() => resolve(items.length))
        const expectedLength = sharedItems.length

        waitABitThen(async () => {
          const snapshotItems = [...sharedItems]
          const snapshotResolves = [...sharedResolves]
          if (snapshotItems.length !== expectedLength) {
            // another invocation has altered the shared queue,
            // stop running now and let that handle the fetch
            return
          }
          sharedItems.length = 0
          sharedResolves.length = 0

          await callbacks.fetchItems(snapshotItems)
          for (const sharedResolve of snapshotResolves) {
            sharedResolve()
          }
        })
      })

      return await promise
    }
  }

  return callbacks
}
