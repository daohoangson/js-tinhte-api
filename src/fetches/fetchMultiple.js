import { isPlainObject, mustBePlainObject } from '../helpers'

const fetchMultipleInit = (fetchJson, batch, internalApi) => {
  const newContext = (batchOptions) => {
    batchOptions = mustBePlainObject(batchOptions)
    batchOptions.triggerHandlers = typeof batchOptions.triggerHandlers === 'boolean'
      ? batchOptions.triggerHandlers
      : true

    const batchId = batch.id
    const batchHeaders = {
      'Content-Type': 'application/json'
    }

    const headers = {...batchHeaders}
    const handlers = {}
    const reqIds = {}
    const requests = []

    const context = {
      batchId,
      batchHeaders,
      batchOptions,

      headers,
      handlers,
      reqIds,
      requests
    }

    return context
  }

  const prepareRequest = (req, context) => {
    const { batchHeaders, headers, handlers, reqIds, requests } = context

    Object.keys(req.options.headers).forEach((headerKey) => {
      if (typeof batchHeaders[headerKey] !== 'undefined') {
        // DO NOT replace a batch header with one from the sub-request
        return
      }

      headers[headerKey] = req.options.headers[headerKey]
    })

    const { id, uniqueId } = req
    const { method, uri } = req.options

    handlers[id] = {
      method,
      resolve: req.resolve,
      reject: req.reject,
      uri
    }

    if (typeof reqIds[uniqueId] === 'undefined') {
      reqIds[uniqueId] = [id]
      requests.push({ id: uniqueId, uri, method })
    } else {
      reqIds[uniqueId].push(id)
    }
  }

  const normalizeJobs = (jobs, context) => {
    const { handlers, reqIds } = context

    Object.keys(jobs).forEach((jobId) => {
      const jobReqIds = reqIds[jobId]
      if (!Array.isArray(jobReqIds)) {
        return
      }
      const firstReqId = jobReqIds[0]
      const handler = handlers[firstReqId]

      jobs[jobId]._req = {
        method: handler.method,
        uri: handler.uri
      }
    })
  }

  const processJob = (job, reqId, context) => {
    const { batchOptions, handlers } = context
    if (!batchOptions.triggerHandlers) {
      return null
    }

    const handler = handlers[reqId]

    const resolve = (job) => {
      internalApi.log('Resolving %s %s...', handler.method, handler.uri)
      return {resolved: handler.resolve(job)}
    }

    const reject = (reason) => {
      internalApi.log('Rejecting %s %s (%s)...', handler.method, handler.uri, reason)
      return {rejected: handler.reject(reason)}
    }

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

    return reject(new Error('Could not find job for request ' + reqId))
  }

  const processJobs = (json, context) => {
    json.jobs = mustBePlainObject(json.jobs)
    const { jobs } = json
    json._handled = 0
    normalizeJobs(jobs, context)

    const { reqIds } = context
    Object.keys(reqIds).forEach((uniqueId) => {
      reqIds[uniqueId].forEach((reqId) => {
        const job = jobs[uniqueId]
        const handled = processJob(job, reqId, context)
        if (handled !== null) {
          json._handled++
        }
      })
    })

    return json
  }

  const fetchMultiple = (fetches, options = {}) => {
    const context = newContext(options)

    batch.init()
    fetches()
    batch.forEach((req) => prepareRequest(req, context))
    batch.reset()

    if (context.requests.length === 0) {
      return Promise.reject(new Error('There is no fetches'))
    }
    const body = JSON.stringify(context.requests)

    const fetchOptions = {
      method: 'POST',
      headers: context.headers,
      body
    }

    internalApi.log('Batch #%d is being fetched...', context.batchId)
    return fetchJson('/batch', fetchOptions)
      .then(json => processJobs(json, context))
  }

  return fetchMultiple
}

export default fetchMultipleInit
