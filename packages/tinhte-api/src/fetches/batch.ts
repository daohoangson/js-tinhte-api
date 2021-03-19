import { StandardizedFetchOptions } from '../helpers/standardizeReqOptions'

export interface Batch {
  enqueue: (resolve: BatchResolve, reject: BatchReject) => void
  forEachReq: (f: (req: BatchRequest) => void) => void
  getId: () => number
  getReqs: () => BatchRequest[]
  pushReq: (req: BatchRequest) => void
  reject: BatchReject
  resolve: BatchResolve
}

export interface BatchRequest {
  id: string
  options: StandardizedFetchOptions
  resolve: BatchResolve
  reject: BatchReject
  uniqueId: string
}

export type BatchResolve = (json: object) => void

export type BatchReject = (reason?: any) => void

export interface Batches {
  init: () => {
    current?: Batch
    other?: Batch
    reset?: () => void
  }
  getCurrent: () => Batch | null
  getCurrentReqs: () => BatchRequest[]
}

interface _QueueEntry {
  resolve: BatchResolve
  reject: BatchReject
}

const batchFactory = (): Batches => {
  let current: Batch | null = null
  let latestId = 0

  const batches: Batches = {
    init: () => {
      if (current != null) {
        return { other: current }
      }

      latestId++
      const currentId = latestId
      const reqs: BatchRequest[] = []
      const queue: _QueueEntry[] = []

      current = {
        enqueue: (resolve, reject) => queue.push({ resolve, reject }),
        forEachReq: (f) => reqs.forEach(f),
        getId: () => currentId,
        getReqs: () => reqs,
        pushReq: (req) => reqs.push(req),
        reject: (reason) => {
          for (const q of queue) {
            q.reject(reason)
          }
        },
        resolve: (json) => {
          for (const q of queue) {
            q.resolve(json)
          }
        }
      }

      const reset = (): void => {
        current = null
      }

      return { current, reset }
    },
    getCurrent: () => current,
    getCurrentReqs: () => current?.getReqs() ?? []
  }

  return batches
}

export default batchFactory
