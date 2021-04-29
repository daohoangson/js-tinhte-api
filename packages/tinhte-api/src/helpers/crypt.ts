import Crypto from 'crypto-js'

export const algos = ['aes128']
const aes128EcbPcks7 = { mode: Crypto.mode.ECB, padding: Crypto.pad.Pkcs7 }

export function encrypt (algo: string, data: string, key: string): string {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = Crypto.MD5(key)
  const encrypted = Crypto.AES.encrypt(data, keyHashed, aes128EcbPcks7)
  const encoded = Crypto.enc.Base64.stringify(encrypted.ciphertext)

  return encoded
}

export function decrypt (algo: string, data: string, key: string): string {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = Crypto.MD5(key)
  const ciphertext = Crypto.enc.Base64.parse(data)
  const cipherParams = Crypto.lib.CipherParams.create({ ciphertext })
  const decrypted = Crypto.AES.decrypt(cipherParams, keyHashed, aes128EcbPcks7)
  const utf8 = decrypted.toString(Crypto.enc.Utf8)

  return utf8
}

export function hashMd5 (data: string): string {
  return Crypto.MD5(data).toString()
}
