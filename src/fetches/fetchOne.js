import { mustBePlainObject } from '../helpers'
import standardizeReqOptions from '../helpers/standardizeReqOptions'

const fetchOneInit = (fetchJson, batch, internalApi) => {
  let reqLatestId = 0

  const fetchOne = (options) => {
    if (typeof options === 'string') {
      options = {uri: options}
    }
    options = mustBePlainObject(options)
    const uniqueId = standardizeReqOptions(options)

    reqLatestId++
    const reqId = reqLatestId

    if (!batch.isOpen() || options.body !== null) {
      internalApi.log('Request #%d is being fetched...', reqId)
      return fetchJson(options)
    } else {
      internalApi.log('Request #%d is joining batch #%d...', reqId, batch.getId())
      return new Promise((resolve, reject) => {
        batch.push({
          options,
          id: '_req' + reqId,
          resolve,
          reject,
          uniqueId
        })
      })
    }
  }

  return fetchOne
}

export default fetchOneInit
