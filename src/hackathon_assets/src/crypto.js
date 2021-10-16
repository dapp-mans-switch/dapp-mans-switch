import { randomBytes } from 'crypto'
import { split, join } from 'shamir'
import { floor } from 'mathjs'
import * as asymCrypto from 'asymmetric-crypto'

export const SHARES = 3
export const MIN_SHARES_TO_RECOVER = floor(SHARES/2)+1

export function generateKeyPair() {
    const keyPair = asymCrypto.keyPair()
    const privateKey = keyPair.secretKey
    const publicKey = keyPair.publicKey
    return {privateKey, publicKey}
}
export function computeKeyShares(private_key) {
    // https://dev.to/simbo1905/shamir-s-secret-sharing-scheme-in-javascript-2o3g
    const utf8Encoder = new TextEncoder()
    const secretBytes = utf8Encoder.encode(private_key)
    const parts = split(randomBytes, SHARES, MIN_SHARES_TO_RECOVER, secretBytes)
    return parts
}

export function reconstructPrivateKey(shares) {
    const recovered = join(shares)
    const utf8Decoder = new TextDecoder()
    return utf8Decoder.decode(recovered)
}

// needs private key of uploader for signature
export function encryptKeyShare(share, uploaderPrivateKey, stakerPublicKey) {
    const shareb64 = keyShareToBase64(share)
    const encrypted = asymCrypto.encrypt(shareb64, stakerPublicKey, uploaderPrivateKey)
    return encrypted.data + '.' + encrypted.nonce
}

// needs public key of uploader to verify authenticity
export function decryptKeyShare(data, stakerPrivateKey, uploaderPublicKey) {
    const ctxtAndNonce = data.split('.')
    const decrypted = asymCrypto.decrypt(ctxtAndNonce[0], ctxtAndNonce[1], uploaderPublicKey, stakerPrivateKey)
    return base64ToKeyShare(decrypted)
}

export function encryptMultipleKeyShares(shares, uploaderPrivateKey, stakerPublicKeys) {
    let encryptedShares = []
    for (let i = 0; i < stakerPublicKeys.length; i++) {
        const encShare = encryptKeyShare(shares[i+1], uploaderPrivateKey, stakerPublicKeys[i])
        encryptedShares.push(encShare)
    }
    return encryptedShares
}

export function keyShareToBase64(keyShare) {
    return Buffer.from(keyShare).toString('base64')
}

export function base64ToKeyShare(data) {
    return new Uint8Array(Buffer.from(data, 'base64'))
}
