import Api from './classes/api'
import { algos, encrypt, decrypt } from './helpers/crypt'
import standardizeReqOptions from './helpers/standardizeReqOptions'

const crypt = { algos, encrypt, decrypt }

// define apiFactory for backward compatibility
// the v4+ Api instance is not 100% compatible with older versions though
const apiFactory = (config) => new Api(config)

export { Api, apiFactory, crypt, standardizeReqOptions }
