import errors from '../helpers/errors'
import standardizeReqOptions, { StandardizedFetchOptions } from '../helpers/standardizeReqOptions'
import { ApiInternal } from '../types'
import { Batches, BatchReject, BatchRequest, BatchResolve } from './batch'
import { FetchHeaders, FetchJson, FetchMultiple, FetchMultipleJob, FetchMultipleJobs, FetchMultipleOptions, FetchParams } from './types'

interface _Context {
  batchHeaders: FetchHeaders
  batchOptions: FetchMultipleOptions

  headers: FetchHeaders
  handlers: Record<string, _Handler>
  reqIds: Record<string, string[]>
  requests: _Request[]
}

interface _Handler {
  method: string
  resolve: BatchResolve
  reject: BatchReject
  uri: string
}

interface _ProcessJobResult {
  resolved?: any
  rejected?: any
}

interface _Request {
  id: string
  method?: string
  params?: FetchParams
  uri: string
}

interface _ResponseJson {
  jobs?: FetchMultipleJobs
  _handled?: number
}

const fetchMultipleInit = (fetchJson: FetchJson, batch: Batches, internalApi: ApiInternal): FetchMultiple => {
  const newContext = (batchOptions: FetchMultipleOptions): _Context => {
    batchOptions.triggerHandlers = typeof batchOptions.triggerHandlers === 'boolean'
      ? batchOptions.triggerHandlers
      : true

    const batchHeaders = {
      'Content-Type': 'application/json'
    }

    return {
      batchHeaders,
      batchOptions,

      headers: { ...batchHeaders },
      handlers: {},
      reqIds: {},
      requests: []
    }
  }

  const prepareRequest = (req: BatchRequest, context: _Context): void => {
    const { batchHeaders, headers, handlers, reqIds, requests } = context

    for (const headerKey in req.options.headers) {
      if (batchHeaders[headerKey] === undefined) {
        // DO NOT replace a batch header with one from the sub-request
        headers[headerKey] = req.options.headers[headerKey]
      }
    }

    const { id, uniqueId } = req
    const { method, params, uri } = req.options

    handlers[id] = {
      method,
      resolve: req.resolve,
      reject: req.reject,
      uri
    }

    if (reqIds[uniqueId] === undefined) {
      reqIds[uniqueId] = [id]
      const req: _Request = {
        id: uniqueId,
        uri: uri === '' ? 'index' : uri
      }
      if (method !== 'GET') req.method = method
      if (Object.keys(params).length > 0) req.params = params

      requests.push(req)
    } else {
      reqIds[uniqueId].push(id)
    }
  }

  const normalizeJobs = (jobs: FetchMultipleJobs, context: _Context): void => {
    const { handlers, reqIds } = context

    for (const jobId in jobs) {
      const jobReqIds = reqIds[jobId]
      if (!Array.isArray(jobReqIds)) {
        continue
      }
      const firstReqId = jobReqIds[0]
      const handler = handlers[firstReqId]

      jobs[jobId]._req = {
        method: handler.method,
        uri: handler.uri
      }
    }
  }

  const processJob = (job: FetchMultipleJob | undefined, reqId: string, context: _Context): _ProcessJobResult | null => {
    const { batchOptions, handlers } = context
    if (batchOptions.triggerHandlers !== true) {
      return null
    }

    const handler = handlers[reqId]

    const resolve = (job: object): _ProcessJobResult => {
      internalApi.log('Resolving %s %s...', handler.method, handler.uri)
      return { resolved: handler.resolve(job) }
    }

    const reject = (reason?: any): _ProcessJobResult => {
      internalApi.log('Rejecting %s %s (%s)...', handler.method, handler.uri, reason)
      return { rejected: handler.reject(reason) }
    }

    if (job !== undefined) {
      if ((job._req === undefined) ||
        job._req.method !== handler.method ||
        job._req.uri !== handler.uri) {
        return reject(new Error(errors.FETCH_MULTIPLE.MISMATCHED))
      }

      if (typeof job._job_result !== 'string') {
        return reject(new Error(errors.FETCH_MULTIPLE.JOB_RESULT_NOT_FOUND))
      }

      if (job._job_result === 'ok' || job._job_result === 'message') {
        return resolve(job)
      } else if (job._job_error !== undefined) {
        return reject(new Error(job._job_error))
      } else {
        return reject(job)
      }
    }

    return reject(new Error(errors.FETCH_MULTIPLE.JOB_NOT_FOUND))
  }

  const processJobs = (json: _ResponseJson, context: _Context): void => {
    const jobs = json.jobs ?? {}
    json._handled = 0
    normalizeJobs(jobs, context)

    const { reqIds } = context
    for (const uniqueId in reqIds) {
      for (const reqId of reqIds[uniqueId]) {
        if (processJob(jobs[uniqueId], reqId, context) !== null) {
          json._handled++
        }
      }
    }
  }

  const fetchMultiple: FetchMultiple = async (fetches, options = {}) => {
    const context = newContext(options)
    const { current, other, reset } = batch.init()

    fetches()
    reset?.call(this)

    return await new Promise<any>((resolve, reject) => {
      if (other != null) {
        return other.enqueue(resolve, reject)
      } else if (current === undefined) {
        return reject(new Error(errors.FETCH_MULTIPLE.NO_BATCH))
      }

      current.enqueue(resolve, reject)
      current.forEachReq((req) => prepareRequest(req, context))

      if (context.requests.length === 0) {
        return current.reject(new Error(errors.FETCH_MULTIPLE.NO_FETCHES))
      }
      const body = JSON.stringify(context.requests)

      const fetchOptions: any = {
        uri: 'batch',
        headers: context.headers,
        body
      }
      standardizeReqOptions(fetchOptions)

      internalApi.log('Batch #%d is being fetched...', current.getId())
      fetchJson(fetchOptions as StandardizedFetchOptions)
        .then(
          (json) => {
            processJobs(json, context)
            current.resolve(json)
          },
          (reason) => {
            processJobs({}, context)
            current.reject(reason)
          }
        )
    })
  }

  return fetchMultiple
}

export default fetchMultipleInit
