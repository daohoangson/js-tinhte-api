const batchFactory = () => {
  let current = null
  let latestId = 0

  const batch = {
    init: () => {
      if (current !== null) {
        return { other: current }
      }

      latestId++
      const currentId = latestId
      const reqs = []
      const queue = []
      const execute = (key, arg0) => queue.forEach((q) => q[key](arg0))

      current = {
        enqueue: (resolve, reject) => queue.push({ resolve, reject }),
        forEachReq: (f) => reqs.forEach(f),
        getId: () => currentId,
        getReqs: () => reqs,
        pushReq: (req) => reqs.push(req),
        reject: (reason) => execute('reject', reason),
        resolve: (json) => execute('resolve', json)
      }

      const reset = () => (current = null)

      return { current, reset }
    },
    getCurrent: () => current,
    getCurrentReqs: () => current.getReqs()
  }

  return batch
}

export default batchFactory
