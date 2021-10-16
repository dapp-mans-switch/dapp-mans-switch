import * as React from "react"
import routToPage from "./router"
import { randomBytes } from "crypto"
import { split, join } from "shamir"
import { floor } from "mathjs"

export default function Uploader() {
    
    function getFreshKeyPair() {
        let elliptic = require('elliptic')
        let ec = new elliptic.ec('secp256k1')
        return ec.genKeyPair()
    }
    
    function computeKeyShares(private_key) {
        // https://dev.to/simbo1905/shamir-s-secret-sharing-scheme-in-javascript-2o3g
        const SHARES = 10
        const MIN_SHARES_TO_RECOVER = floor(SHARES/2)+1

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
    
    function test() {
        const keyPair = getFreshKeyPair()
        const privateKeyHex = keyPair.getPrivate("hex")

        const keyShares = computeKeyShares(privateKeyHex)
        delete keyShares[1]
        delete keyShares[2]
        delete keyShares[3]
        delete keyShares[4]
        
        const reconstructedPrivateKeyHex = reconstructPrivateKey(keyShares)
        console.log(reconstructedPrivateKeyHex == privateKeyHex)
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