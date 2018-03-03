import standardizeReqOptions from '../helpers/standardizeReqOptions'

const fetchOneInit = (fetchJson, batch, internalApi) => {
  let reqLatestId = 0

  const fetchOne = (uri, method = 'GET', headers = {}, body = null) => {
    const options = {uri, method, headers, body}
    const uniqueId = standardizeReqOptions(options)

    reqLatestId++
    const reqId = reqLatestId

    if (!batch.isOpen() || body !== null) {
      internalApi.log('Request #%d is being fetched...', reqId)
      return fetchJson(options.uri, options)
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
