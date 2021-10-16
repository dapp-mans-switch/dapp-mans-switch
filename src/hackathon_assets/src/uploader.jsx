import * as React from 'react'
import routToPage from './router'
import * as crypto from './crypto'

export default function Uploader() {
    
    function test() {
        // uploader generates a key pair
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const uploaderPublicKey = uploaderKeyPair.publicKey
        // staker1 generates a key pair
        const staker1KeyPair = crypto.generateKeyPair()
        const staker1PrivateKey = staker1KeyPair.privateKey
        const staker1PublicKey = staker1KeyPair.publicKey
        // staker2 generates a key pair
        const staker2KeyPair = crypto.generateKeyPair()
        const staker2PrivateKey = staker2KeyPair.privateKey
        const staker2PublicKey = staker2KeyPair.publicKey
        // staker3 generates a key pair
        const staker3KeyPair = crypto.generateKeyPair()
        const staker3PrivateKey = staker3KeyPair.privateKey
        const staker3PublicKey = staker3KeyPair.publicKey

        const stakerPublicKeys = [staker1PublicKey, staker2PublicKey, staker3PublicKey]
        
        // TEST

        // compute sharing of private key
        const keyShares = crypto.computeKeyShares(uploaderPrivateKey)
        // encrypt shares with pub key of stakers
        const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyShares, uploaderPrivateKey, stakerPublicKeys)
        console.log(encryptedKeyShares)

        // lets say one of the 3 keyshares got lost
        const share1 = crypto.decryptKeyShare(encryptedKeyShares[0], staker1PrivateKey, uploaderPublicKey)
        const share2 = crypto.decryptKeyShare(encryptedKeyShares[1], staker2PrivateKey, uploaderPublicKey)
        const shares = {1: share1, 2: share2}
        const reconstructedPrivateKey = crypto.reconstructPrivateKey(shares)

        console.log(reconstructedPrivateKey == uploaderPrivateKey)
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