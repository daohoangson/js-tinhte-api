const waitABitThen = (callback) => {
  /* istanbul ignore else */
  if (window && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback)
  } else {
    setTimeout(callback, 0)
  }
}

const helperCallbacksInit = (api) => {
  const sharedItems = []
  const sharedResolves = []

  const add = (list, callback, triggerNow) => {
    const { items } = list
    items.push(callback)
    api._log('Added new %s callback, total=%d', list.name, items.length)

    const cancel = () => {
      const i = items.indexOf(callback)
      if (i < 0) {
        return false
      }

      items.splice(i, 1)
      api._log('Removed %s callback #%d, remaining=%d', list.name, i, items.length)
      return true
    }

    if (triggerNow) {
      fetchList(list)
    }

    return cancel
  }

  const fetchItems = (items, options = {}) => {
    if (items.length === 0) {
      return Promise.resolve([])
    }

    const fetches = () => {
      items.forEach((callback) => callback())
      api._log('Triggered %d callbacks', items.length)

      items.length = 0
    }

    return api.fetchMultiple(fetches, options)
      .catch(() => [])
  }

  const fetchList = (list) => {
    const { items } = list
    const callbackCount = items.length

    const promise = new Promise((resolve) => {
      items.forEach((callback) => sharedItems.push(callback))
      sharedResolves.push(() => resolve(callbackCount))

      const sharedItemsLength = sharedItems.length
      waitABitThen(() => {
        if (sharedItems.length !== sharedItemsLength) {
          // another invocation has altered the shared queue,
          // stop running now and let that handle the fetch
          return
        }

        fetchItems(sharedItems)
          .then((result) => {
            sharedResolves.forEach((sqr) => sqr(result))
            sharedResolves.length = 0
          })
      })

      items.length = 0
    })

    return promise
  }

  return {
    add,
    fetchItems,
    fetchList
  }
}

export default helperCallbacksInit
