import apiFactory from './factory'
import apiHoc from './hoc'
import { algos, encrypt, decrypt } from './helpers/crypt'
import { processCallback } from './components/Callback'

const crypt = { algos, encrypt, decrypt }

export { apiFactory, apiHoc, crypt, processCallback }

export default {
  apiFactory,
  apiHoc,
  crypt,
  processCallback
}
