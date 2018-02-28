import md5 from 'md5'

const fetchOneInit = (fetchJson, batch, internalApi) => {
  let reqLatestId = 0

  const fetchOne = (uri, method = 'GET', headers = {}, body = null) => {
    if (!uri) {
      return Promise.reject(new Error('uri is required'))
    }

    reqLatestId++
    const reqId = reqLatestId

    const options = {
      uri,
      method,
      headers,
      body
    }

    if (!batch.isOpen() || body !== null) {
      internalApi.log('Request #%d is being fetched...', reqId)
      return fetchJson(uri, options)
    } else {
      internalApi.log('Request #%d is joining batch #%d...', reqId, batch.getId())
      return new Promise((resolve, reject) => {
        batch.push({
          options,
          id: '_req' + reqId,
          resolve,
          reject,
          uniqueId: md5(method + uri)
        })
      })
    }
  }

  return fetchOne
}

export default fetchOneInit
