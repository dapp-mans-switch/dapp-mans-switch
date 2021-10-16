import * as React from 'react'
import routToPage from './router'
import { randomBytes } from 'crypto'
import { split, join } from 'shamir'
import { floor } from 'mathjs'
import * as asymCrypto from 'asymmetric-crypto'

export default function Uploader() {
    const SHARES = 3
    const MIN_SHARES_TO_RECOVER = floor(SHARES/2)+1

    
    function computeKeyShares(private_key) {
        // https://dev.to/simbo1905/shamir-s-secret-sharing-scheme-in-javascript-2o3g
        const utf8Encoder = new TextEncoder()
        const secretBytes = utf8Encoder.encode(private_key)
        const parts = split(randomBytes, SHARES, MIN_SHARES_TO_RECOVER, secretBytes)
        return parts
    }

    function reconstructPrivateKey(shares) {
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
    function decryptKeyShare(data, stakerPrivateKey, uploaderPublicKey) {
        const ctxtAndNonce = data.split('.')
        const decrypted = asymCrypto.decrypt(ctxtAndNonce[0], ctxtAndNonce[1], uploaderPublicKey, stakerPrivateKey)
        return base64ToKeyShare(decrypted)
    }

    function encryptMultipleKeyShares(shares, uploaderPrivateKey, stakerPublicKeys) {
        let encryptedShares = []
        for (let i = 0; i < stakerPublicKeys.length; i++) {
            const encShare = encryptKeyShare(shares[i+1], uploaderPrivateKey, stakerPublicKeys[i])
            encryptedShares.push(encShare)
        }
        return encryptedShares
    }

    function keyShareToBase64(keyShare) {
        return Buffer.from(keyShare).toString('base64')
    }

    function base64ToKeyShare(data) {
        return new Uint8Array(Buffer.from(data, 'base64'))
    }
    
    function test() {
        // uploader generates a key pair
        const uploaderKeyPair = asymCrypto.keyPair()
        const uploaderPrivateKey = uploaderKeyPair.secretKey
        const uploaderPublicKey = uploaderKeyPair.publicKey
        // staker1 generates a key pair
        const staker1KeyPair = asymCrypto.keyPair()
        const staker1PrivateKey = staker1KeyPair.secretKey
        const staker1PublicKey = staker1KeyPair.publicKey
        // staker2 generates a key pair
        const staker2KeyPair = asymCrypto.keyPair()
        const staker2PrivateKey = staker2KeyPair.secretKey
        const staker2PublicKey = staker2KeyPair.publicKey
        // staker3 generates a key pair
        const staker3KeyPair = asymCrypto.keyPair()
        const staker3PrivateKey = staker3KeyPair.secretKey
        const staker3PublicKey = staker3KeyPair.publicKey

        const stakerPublicKeys = [staker1PublicKey, staker2PublicKey, staker3PublicKey]
        
        // TEST

        // compute sharing of private key
        const keyShares = computeKeyShares(uploaderPrivateKey)
        // encrypt shares with pub key of stakers
        const encryptedKeyShares = encryptMultipleKeyShares(keyShares, uploaderPrivateKey, stakerPublicKeys)
        console.log(encryptedKeyShares)

        // lets say one of the 3 keyshares got lost
        const share1 = decryptKeyShare(encryptedKeyShares[0], staker1PrivateKey, uploaderPublicKey)
        const share2 = decryptKeyShare(encryptedKeyShares[1], staker2PrivateKey, uploaderPublicKey)
        const shares = {1: share1, 2: share2}
        const reconstructedPrivateKey = reconstructPrivateKey(shares)

        console.log(reconstructedPrivateKey == uploaderPrivateKey)

        // regenerate a public key from a secret key
        // const pubKey = asmCrypto.fromSecretKey(keyPair.secretKey).publicKey
    }

    
    return (
        <div>
            <h1>Uploader</h1>
            <p>This is the Uploader's page.</p>
            <a id="add_new_stake_button" data-text="Start Stake" onClick={test} class="rainbow-button" style={{width: 300}}></a>
            <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
        </div>
        )
    }