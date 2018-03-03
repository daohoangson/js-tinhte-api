import { isPlainObject, mustBePlainObject } from '../helpers'

const fetchMultipleInit = (fetchJson, batch, internalApi) => {
  const fetchMultiple = (fetches, options = {}) => {
    options = mustBePlainObject(options)
    const triggerHandlers = typeof options.triggerHandlers === 'boolean' ? options.triggerHandlers : true

    batch.init()
    const batchId = batch.id
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
      let { jobs } = json
      jobs = mustBePlainObject(jobs)
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

        const job = jobs[jobId]
        if (isPlainObject(job)) {
          if (!isPlainObject(job._req) ||
            job._req.method !== handler.method ||
            job._req.uri !== handler.uri) {
            return reject(new Error('Detected mismatched job and request data'))
          }

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

      Object.keys(jobs).forEach((jobId) => {
        const jobReqIds = reqIds[jobId]
        if (!Array.isArray(jobReqIds) || jobReqIds.length === 0) {
          return
        }
        const firstReqId = jobReqIds[0]
        const handler = handlers[firstReqId]

        jobs[jobId]._req = {
          method: handler.method,
          uri: handler.uri
        }
      })

      Object.keys(reqIds).forEach((uniqueId) => {
        reqIds[uniqueId].forEach((reqId) => handle(uniqueId, reqId))
      })

      return json
    }

    internalApi.log('Batch #%d is being fetched...', batchId)
    return fetchJson('/batch', {method: 'POST', headers, body})
      .then(json => {
        return processJobs(json)
      })
  }

  return fetchMultiple
}

export default fetchMultipleInit
