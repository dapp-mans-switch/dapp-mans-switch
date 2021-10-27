import { randomBytes } from 'crypto'
import { split, join } from 'shamir'
import { floor } from 'mathjs'
import * as asymCrypto from 'asymmetric-crypto'


export function minSharesToRecover(number_of_shares) {
    return floor(number_of_shares/2)+1
}

export function enoughSharesToDecrypt(nShares, nSharesToRecover) {
    return nSharesToRecover >= (floor(nShares/2) + 1)
}

export function generateKeyPair() {
    const keyPair = asymCrypto.keyPair()
    const privateKey = keyPair.secretKey
    const publicKey = keyPair.publicKey
    return {privateKey, publicKey}
}

export function computeKeyShares(private_key, number_of_shares) {
    // https://dev.to/simbo1905/shamir-s-secret-sharing-scheme-in-javascript-2o3g
    const utf8Encoder = new TextEncoder()
    const secretBytes = utf8Encoder.encode(private_key)
    const shares = split(randomBytes, number_of_shares, minSharesToRecover(number_of_shares), secretBytes)
    return shares
}

export function reconstructPrivateKey(shares) {
    const recovered = join(shares)
    const utf8Decoder = new TextDecoder()
    return utf8Decoder.decode(recovered)
}

// needs private key of uploader for signature
function encryptKeyShare(share, uploaderPrivateKey, stakerPublicKey) {
    const shareb64 = keyShareToBase64(share)
    const encrypted = asymCrypto.encrypt(shareb64, stakerPublicKey, uploaderPrivateKey)
    return encrypted.data + '.' + encrypted.nonce
}

// needs public key of uploader to verify authenticity
export function decryptKeyShare(data, stakerPrivateKey, uploaderPublicKey) {
    const ctxtAndNonce = data.split('.')
    const decrypted = asymCrypto.decrypt(ctxtAndNonce[0], ctxtAndNonce[1], uploaderPublicKey, stakerPrivateKey)
    return decrypted
}

export function encryptSecret(secret, uploaderPrivateKey) {
    const uploaderPublicKey = asymCrypto.fromSecretKey(uploaderPrivateKey).publicKey
    const encrypted = asymCrypto.encrypt(secret, uploaderPublicKey, uploaderPrivateKey)
    return encrypted.data + '.' + encrypted.nonce
}

export function decryptSecret(data, reconstructedUploaderPrivateKey) {
    const uploaderPublicKey = asymCrypto.fromSecretKey(reconstructedUploaderPrivateKey).publicKey
    const ctxtAndNonce = data.split('.')
    const plaintext = asymCrypto.decrypt(ctxtAndNonce[0], ctxtAndNonce[1], uploaderPublicKey, reconstructedUploaderPrivateKey)
    return plaintext
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
