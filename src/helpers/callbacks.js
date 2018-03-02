const helperCallbacksInit = (api, internalApi) => {
  const sharedItems = []
  const sharedResolves = []

  const add = (list, callback, triggerNow) => {
    if (triggerNow) {
      callback()
      internalApi.log('Triggered %s callback without adding', list.name)
      return () => false
    }

    const { items } = list
    items.push(callback)
    internalApi.log('Added new %s callback, total=%d', list.name, items.length)

    const cancel = () => {
      const i = items.indexOf(callback)
      if (i < 0) {
        return false
      }

      items.splice(i, 1)
      internalApi.log('Removed %s callback #%d, remaining=%d', list.name, i, items.length)
      return true
    }

    return cancel
  }

  const fetchItems = (items, options = {}) => {
    const fetches = () => {
      items.forEach((callback) => callback())
      internalApi.log('Triggered %d callbacks', items.length)

      items.length = 0
    }

    return api.fetchMultiple(fetches, options)
  }

  const fetchList = (list) => {
    const { items } = list
    const callbackCount = items.length

    const promise = new Promise((resolve, reject) => {
      if (callbackCount === 0) {
        return resolve(callbackCount)
      }

      items.forEach((callback) => sharedItems.push(callback))
      sharedResolves.push(() => resolve(callbackCount))

      const sharedItemsLength = sharedItems.length
      setTimeout(() => {
        if (sharedItems.length !== sharedItemsLength) {
          // another invocation has altered the shared queue,
          // stop running now and let that handle the fetch
          return
        }

        return fetchItems(sharedItems)
          .then((json) => {
            sharedResolves.forEach((sqr) => sqr(json))
            sharedResolves.length = 0

            return json
          })
      }, 0)

      items.length = 0
    })

    internalApi.log('Queued %d %s callbacks', callbackCount, list.name)

    return promise
  }

  return {
    add,
    fetchItems,
    fetchList
  }
}

export default helperCallbacksInit
