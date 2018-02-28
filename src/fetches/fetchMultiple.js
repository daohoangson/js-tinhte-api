const fetchMultipleInit = (fetchJson, batch, internalApi) => {
  const cache = {
    items: [],

    get: (body) => {
      let found = null

      cache.items.forEach((cache) => {
        if (cache.body !== body) {
          return
        }

        found = JSON.parse(cache.json)
      })

      if (found !== null) {
        found._fromCache = true
        internalApi.log('Found cached json for %s', body)
      }

      return found
    },

    reset: () => (cache.items.length = 0),

    set: (body, json) => cache.items.push({body, json: JSON.stringify(json)})
  }

  const fetchMultiple = (fetches, options = {}) => {
    if (typeof options !== 'object') {
      options = {}
    }
    const triggerHandlers = typeof options.triggerHandlers === 'boolean' ? options.triggerHandlers : true
    const useCache = typeof options.useCache === 'boolean' ? options.useCache : false

    batch.init()
    fetches()

    const headers = {}
    const handlers = {}
    const batchBody = []
    const reqIds = {}
    batch.forEach((req) => {
      Object.keys(req.options.headers).forEach((headerKey) => {
        headers[headerKey] = req.options.headers[headerKey]
      })

      const { id, uniqueId } = req
      const uri = req.options.uri
      const method = req.options.method.toUpperCase()

      handlers[id] = {
        method,
        resolve: req.resolve,
        reject: req.reject,
        uri
      }

      if (typeof reqIds[uniqueId] === 'undefined') {
        reqIds[uniqueId] = [id]
        batchBody.push({ id: uniqueId, uri, method })
      } else {
        reqIds[uniqueId].push(id)
      }
    })

    batch.reset()

    if (batchBody.length === 0) {
      return Promise.reject(new Error('There is no fetches'))
    }

    const body = JSON.stringify(batchBody)

    const processJobs = (json) => {
      const jobs = typeof json.jobs === 'object' ? json.jobs : {}
      json._handled = 0

      const handle = (jobId, reqId) => {
        if (!triggerHandlers) {
          return
        }

        const handler = handlers[reqId]

        const resolve = (job) => {
          json._handled++
          internalApi.log('Resolving %s %s...', handler.method, handler.uri)

          return handler.resolve(job)
        }

        const reject = (reason) => {
          json._handled++
          internalApi.log('Rejecting %s %s (%s)...', handler.method, handler.uri, reason)

          return handler.reject(reason)
        }

        if (typeof jobs[jobId] === 'object') {
          const job = jobs[jobId]
          if (typeof job._job_result === 'string') {
            if (job._job_result === 'ok') {
              return resolve(job)
            } else if (job._job_error) {
              return reject(job._job_error)
            }
          }
        }

        return reject(new Error('Could not find job ' + jobId))
      }

      Object.keys(reqIds).forEach((uniqueId) => {
        reqIds[uniqueId].forEach((reqId) => handle(uniqueId, reqId))
      })

      return json
    }

    if (!useCache) {
      cache.reset()
    } else {
      const json = cache.get(body)
      if (json !== null) {
        return new Promise((resolve) => resolve(processJobs(json)))
      }
    }

    return fetchJson('/batch', {method: 'POST', headers, body})
      .then(json => {
        if (useCache) {
          cache.set(body, json)
        }

        return processJobs(json)
      })
  }

  return fetchMultiple
}

export default fetchMultipleInit
