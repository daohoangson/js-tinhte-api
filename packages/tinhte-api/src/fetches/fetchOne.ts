import standardizeReqOptions, { StandardizedFetchOptions } from '../helpers/standardizeReqOptions'
import { ApiInternal } from '../types'
import { Batches } from './batch'
import { FetchJson, FetchOne } from './types'

const fetchOneInit = (fetchJson: FetchJson, batch: Batches, internalApi: ApiInternal): FetchOne => {
  let reqLatestId = 0

  const fetchOne: FetchOne = async (input) => {
    if (typeof input === 'string') {
      input = { uri: input }
    }
    if (typeof input !== 'object') {
      input = {}
    }
    const uniqueId = standardizeReqOptions(input as any)
    const options = input as StandardizedFetchOptions

    reqLatestId++
    const reqId = reqLatestId
    const current = batch.getCurrent()

    if (current === null || options.body !== null || !options.parseJson) {
      internalApi.log('Request #%d is being fetched...', reqId)
      return await fetchJson(options)
    } else {
      internalApi.log('Request #%d is joining batch #%d...', reqId, current.getId())
      return await new Promise<any>((resolve, reject) => {
        const id = `_req${reqId}`
        current.pushReq({ id, options, resolve, reject, uniqueId })
      })
    }
  }

  return fetchOne
}

export default fetchOneInit
