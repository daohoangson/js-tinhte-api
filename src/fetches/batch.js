const batchFactory = (reqs) => {
  let isOpen = false
  let latestId = 0
  if (!Array.isArray(reqs)) reqs = []
  const resolves = []
  const rejects = []

  const batch = {
    forEach: (f) => reqs.forEach(f),
    getId: () => latestId,
    init: (resolve, reject) => {
      resolves.push(resolve)
      rejects.push(reject)

      if (isOpen) {
        return false
      }

      isOpen = true
      latestId++
      reqs.length = 0

      return latestId
    },
    isOpen: () => isOpen,
    push: (req) => reqs.push(req),
    reject: (reason) => rejects.forEach((reject) => reject(reason)),
    resolve: (json) => resolves.forEach((resolve) => resolve(json)),
    reset: () => (isOpen = false)
  }

  return batch
}

export default batchFactory
