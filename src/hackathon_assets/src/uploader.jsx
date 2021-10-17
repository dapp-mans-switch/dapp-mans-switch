import * as React from 'react'
import * as crypto from './crypto'
import * as helpers from './helpers'
import { hackathon } from '../../declarations/hackathon'
import routToPage from './router'

const TEST = true

export default function Uploader() {

    const [secret, setSecret] = React.useState('')
    const [reward, setReward] = React.useState('')
    const [expiryTime, setExpiryTime] = React.useState('')
    const [heartbeatFreq, setHeartbeatFreq] = React.useState('')

    function validateInput(secret, reward, expiryTime, heartbeatFreq) {
        if (secret == '') {
            throw 'secret must not be empty'
        }
        // TODO validate expirytime input properly
        const expiryTimeInUTCSecs = (new Date(expiryTime)).getTime()
        const rewardInt = getPositiveNumber(reward)
        const heartbeatFreqInt = getPositiveNumber(heartbeatFreq)
        return {secret, rewardInt, expiryTimeInUTCSecs, heartbeatFreqInt}
    }
    
    async function uploadSecret() {
        let input
        if (TEST) {
            testSecretEnDecryption()
            testSharingAndReconstruction()
            input = {'secret': 'my top secret secret', 'rewardInt': 420, 'expiryTimeInUTCSecs': 1634429840, 'heartbeatFreqInt': 1}
        } else {
            try {
                input = validateInput(secret, reward, expiryTime, heartbeatFreq)
            } catch {
                alert('Please check your input!')
                return
            }
        }

        // uploader generates a fresh key pair
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey

        // encrypt the secret
        const encryptedSecret = crypto.encryptSecret(input.secret, uploaderPrivateKey)

        // choose stakers
        const stakers = await helpers.drawStakers()
        console.log(stakers)
        const principals = helpers.getPrincipalsOfStakers(stakers)
        const stakerPublicKeys = helpers.getPublicKeysOfStakers(stakers)

        // send to backend
        const newSecretId = await hackathon.addSecret(encryptedSecret, input.rewardInt, input.expiryTimeInUTCSecs, input.heartbeatFreqInt, principals)
        alert(`Secret with ID ${newSecretId} uploaded!`)

        // create shares of the private key
        const keyshares = crypto.computeKeyShares(uploaderPrivateKey)

        // encrypt them so only the desired staker can read it
        const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyshares, uploaderPrivateKey, stakerPublicKeys)
        console.log(encryptedKeyShares)
        // TODO distribute encrypted keyshares to stakers        
    }

    function testSecretEnDecryption() {
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const secret = 'very secret'
        const encryptedSecret = crypto.encryptSecret(secret, uploaderPrivateKey)
        const plaintext = crypto.decryptSecret(encryptedSecret, uploaderPrivateKey)
        console.log(secret == plaintext)
    }

    function testSharingAndReconstruction() {
         const uploaderKeyPair = crypto.generateKeyPair()
         const uploaderPrivateKey = uploaderKeyPair.privateKey
         const uploaderPublicKey = uploaderKeyPair.publicKey
         const staker1KeyPair = crypto.generateKeyPair()
         const staker1PrivateKey = staker1KeyPair.privateKey
         const staker1PublicKey = staker1KeyPair.publicKey
         const staker2KeyPair = crypto.generateKeyPair()
         const staker2PrivateKey = staker2KeyPair.privateKey
         const staker2PublicKey = staker2KeyPair.publicKey
         const staker3KeyPair = crypto.generateKeyPair()
         const staker3PrivateKey = staker3KeyPair.privateKey
         const staker3PublicKey = staker3KeyPair.publicKey
         const stakerPublicKeys = [staker1PublicKey, staker2PublicKey, staker3PublicKey]

         const keyshares = crypto.computeKeyShares(uploaderPrivateKey)
         const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyshares, uploaderPrivateKey, stakerPublicKeys)
 
         // lets say 1 of the 3 keyshares got lost
         const share1 = crypto.decryptKeyShare(encryptedKeyShares[0], staker1PrivateKey, uploaderPublicKey)
         const share2 = crypto.decryptKeyShare(encryptedKeyShares[1], staker2PrivateKey, uploaderPublicKey)
         const shares = {1: share1, 2: share2}
         const reconstructedPrivateKey = crypto.reconstructPrivateKey(shares)
         // can still reconstruct
         console.log(reconstructedPrivateKey == uploaderPrivateKey)
    }

    
    return (
        <div>
            <h1>Uploader</h1>
            <label htmlFor="secret">Your secret to be published:</label>
            <br/>

            <textarea id="secret" type="text" onChange={(ev) => setSecret(ev.target.value)} rows="10" cols="50"/>
            <br/>

            <label htmlFor="reward">Reward your Openers with</label>
            <input id="reward" type="number" onChange={(ev) => setReward(ev.target.value)}/>
            <label>$HRBT</label>
            <br/>

            <label htmlFor="heartbeatFreq">Prove your liveliness every</label>
            <input id="heartbeatFreq" type="number" onChange={(ev) => setHeartbeatFreq(ev.target.value)}/>
            <label>days</label>
            <br/>

            <label htmlFor="expiryTime">Your secret will be released at the latest on:</label>
            <input id="expiryTime" type="datetime-local" onChange={(ev) => setExpiryTime(ev.target.value)}/>
            <br/>

            <a id="secret_btn" data-text="Upload secret" onClick={uploadSecret} class="rainbow-button" style={{width: 300}}/>
            <button onClick={() => {routToPage('Main')}}>Back to Start Page</button>
        </div>
        )
    }