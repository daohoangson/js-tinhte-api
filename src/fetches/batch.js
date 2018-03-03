const batchFactory = (reqs) => {
  let batchLatestId = 0
  if (!Array.isArray(reqs)) reqs = []

  const batch = {
    id: 0,

    forEach: (f) => reqs.forEach(f),
    getId: () => batch.id,
    init: () => {
      batchLatestId++
      batch.id = batchLatestId
      reqs.length = 0
    },
    isOpen: () => batch.id > 0,
    push: (req) => reqs.push(req),
    reset: () => (batch.id = 0)
  }

  return batch
}

export default batchFactory
