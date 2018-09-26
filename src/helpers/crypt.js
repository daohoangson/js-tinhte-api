import aes from 'crypto-js/aes'
import CryptoJS from 'crypto-js/core'
import encBase64 from 'crypto-js/enc-base64'
import encUtf8 from 'crypto-js/enc-utf8'
import md5 from 'crypto-js/md5'
import modeEcb from 'crypto-js/mode-ecb'
import padPkcs7 from 'crypto-js/pad-pkcs7'

const algos = ['aes128']
const aes128EcbPcks7 = { mode: modeEcb, padding: padPkcs7 }

const encrypt = (algo, data, key) => {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = md5(key)
  const encrypted = aes.encrypt(data, keyHashed, aes128EcbPcks7)
  const encoded = encBase64.stringify(encrypted.ciphertext)

  return encoded
}

const decrypt = (algo, data, key) => {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = md5(key)
  const ciphertext = encBase64.parse(data)
  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext })
  const decrypted = aes.decrypt(cipherParams, keyHashed, aes128EcbPcks7)
  const utf8 = decrypted.toString(encUtf8)

  return utf8
}

export {
  algos,
  encrypt,
  decrypt
}
