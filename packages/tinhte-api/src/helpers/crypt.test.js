import { expect } from '@esm-bundle/chai'

import { algos, encrypt, decrypt } from './crypt'

describe('helpers', () => {
  describe('crypt', () => {
    const algo = algos[0]
    const data = 'data'
    const dataEncrypted = '0d57IPTKyJmWrsDkjHGD5g=='
    const key = 'key'

    it('should encrypt', () => {
      const result = encrypt(algo, data, key)
      expect(result).equals(dataEncrypted)
    })

    it('should decrypt', () => {
      const result = decrypt(algo, dataEncrypted, key)
      expect(result).equals(data)
    })

    it('rejects invalid algo for encryption', () => {
      const catched = []
      try {
        encrypt('algo', data, key)
      } catch (e) {
        catched.push(e)
      }

      expect(catched.length).equals(1)
    })

    it('rejects invalid algo for decryption', () => {
      const catched = []
      try {
        decrypt('algo', dataEncrypted, key)
      } catch (e) {
        catched.push(e)
      }

      expect(catched.length).equals(1)
    })
  })
})
