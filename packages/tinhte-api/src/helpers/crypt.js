import { AES as aes } from 'crypto-es/lib/aes'
import { CipherParams, Pkcs7 as padPkcs7 } from 'crypto-es/lib/cipher-core'
import { Base64 as encBase64 } from 'crypto-es/lib/enc-base64'
import { Utf8 as encUtf8 } from 'crypto-es/lib/core'
import { MD5 as md5 } from 'crypto-es/lib/md5'
import { ECB as modeEcb } from 'crypto-es/lib/mode-ecb'

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
  const cipherParams = CipherParams.create({ ciphertext })
  const decrypted = aes.decrypt(cipherParams, keyHashed, aes128EcbPcks7)
  const utf8 = decrypted.toString(encUtf8)

  return utf8
}

const hashMd5 = (data) => md5(data).toString()

export {
  algos,
  encrypt,
  decrypt,
  hashMd5
}
