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
    function encryptShare(data, uploaderPrivateKey, stakerPublicKey) {
        const encrypted = crypto.encrypt(data, stakerPublicKey, uploaderPrivateKey)
        return encrypted
    }

    // needs public key of uploader to verify authenticity
    function decryptShare(ctxtAndNonce, stakerPrivateKey, uploaderPublicKey) {
        const decrypted = crypto.decrypt(ctxtAndNonce.data, ctxtAndNonce.nonce, uploaderPublicKey, stakerPrivateKey)
        return decrypted
    }
    
    function test() {
        // uploader generates a key pair
        const uploaderKeyPair = asymCrypto.keyPair()
        const uploaderPrivateKey = uploaderKeyPair.secretKey
        const uploaderPublicKey = uploaderKeyPair.publicKey

        // share the private key
        const keyShares = computeKeyShares(uploaderPrivateKey)
        delete keyShares[1]
        
        const reconstructedPrivateKey = reconstructPrivateKey(keyShares)
        console.log(reconstructedPrivateKey == uploaderPrivateKey)

        // regenerate a public key from a secret key
        // const pubKey = crypto.fromSecretKey(keyPair.secretKey).publicKey
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