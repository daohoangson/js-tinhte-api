import standardizeReqOptions from '../helpers/standardizeReqOptions'

const fetchOneInit = (fetchJson, batch, internalApi) => {
  let reqLatestId = 0

  const fetchOne = (options = {}) => {
    if (typeof options === 'string') {
      options = { uri: options }
    }
    const uniqueId = standardizeReqOptions(options)

    reqLatestId++
    const reqId = reqLatestId
    const current = batch.getCurrent()

    const fetchIndividually = (
      current === null ||
      options.body !== null ||
      options.parseJson === false
    )

    if (fetchIndividually) {
      internalApi.log('Request #%d is being fetched...', reqId)
      return fetchJson(options)
    } else {
      internalApi.log('Request #%d is joining batch #%d...', reqId, current.getId())
      return new Promise((resolve, reject) => {
        const id = '_req' + reqId
        current.pushReq({ id, options, resolve, reject, uniqueId })
      })
    }
  }

  return fetchOne
}

export default fetchOneInit
