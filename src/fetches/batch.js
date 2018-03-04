const batchFactory = (reqs) => {
  let isOpen = false
  let latestId = 0
  if (!Array.isArray(reqs)) reqs = []

  const batch = {
    forEach: (f) => reqs.forEach(f),
    getId: () => latestId,
    init: () => {
      isOpen = true
      latestId++
      reqs.length = 0
    },
    isOpen: () => isOpen,
    push: (req) => reqs.push(req),
    reset: () => (isOpen = false)
  }

  return batch
}

export default batchFactory
