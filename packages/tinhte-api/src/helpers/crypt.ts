import CryptoES from 'crypto-js'

export const algos = ['aes128']
const aes128EcbPcks7 = { mode: CryptoES.mode.ECB, padding: CryptoES.pad.Pkcs7 }

export function encrypt (algo: string, data: string, key: string): string {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = CryptoES.MD5(key)
  const encrypted = CryptoES.AES.encrypt(data, keyHashed, aes128EcbPcks7)
  const encoded = CryptoES.enc.Base64.stringify(encrypted.ciphertext)

  return encoded
}

export function decrypt (algo: string, data: string, key: string): string {
  if (algo !== algos[0]) {
    throw new Error('Unsupported algo: ' + algo)
  }

  const keyHashed = CryptoES.MD5(key)
  const ciphertext = CryptoES.enc.Base64.parse(data)
  const cipherParams = CryptoES.lib.CipherParams.create({ ciphertext })
  const decrypted = CryptoES.AES.decrypt(cipherParams, keyHashed, aes128EcbPcks7)
  const utf8 = decrypted.toString(CryptoES.enc.Utf8)

  return utf8
}

export function hashMd5 (data: string): string {
  return CryptoES.MD5(data).toString()
}
