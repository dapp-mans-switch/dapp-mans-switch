import * as React from 'react'
import * as crypto from './crypto'
import * as helpers from './helpers'
//import { hackathon } from '../../declarations/hackathon'
import routToPage from './router'

const TEST = true

export default function Uploader(props) {
    const hackathon = props.actor;
    const identity = props.identity;

    const [secret, setSecret] = React.useState('')
    const [reward, setReward] = React.useState('')
    const [expiryTime, setExpiryTime] = React.useState('')
    const [heartbeatFreq, setHeartbeatFreq] = React.useState('')

    function validateInput(secret, reward, expiryTime, heartbeatFreq) {
        if (secret == '') {
            throw 'secret must not be empty'
        }
        // TODO validate expirytime input properly
        const expiryTimeInUTCSecs = (new Date(expiryTime)).getTime() / 1_000
        const rewardInt = helpers.getPositiveNumber(reward)
        const heartbeatFreqInt = helpers.getPositiveNumber(heartbeatFreq)
        return {secret, rewardInt, expiryTimeInUTCSecs, heartbeatFreqInt}
    }
    
    async function uploadSecret() {
        let input
        if (TEST) {
            testSecretEnDecryption()
            testSharingAndReconstruction()
            return
            input = {'secret': 'my top secret secret', 'rewardInt': 420, 'expiryTimeInUTCSecs': 1634429840, 'heartbeatFreqInt': 1}
        } else {
            try {
                input = validateInput(secret, reward, expiryTime, heartbeatFreq)
            } catch (error) {
                console.log(error)
                alert('Please check your input!')
                return
            }
        }

        // uploader generates a fresh key pair
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const uploaderPublicKey = uploaderKeyPair.publicKey

        // encrypt the secret
        const encryptedSecret = crypto.encryptSecret(input.secret, uploaderPrivateKey)

        // choose stakers
        const stakes = await helpers.drawStakes()
        console.log("Stakes", stakes)
        const principals = helpers.getPrincipalsOfStakes(stakes)
        const stakePublicKeys = helpers.getPublicKeysOfStakes(stakes)
        const stakeIds = helpers.getIdsOfStakes(stakes)
        console.log("Principals", principals)
        console.log("StakeIds", stakeIds)

        // create shares of the private key
        const keyshares = crypto.computeKeyShares(uploaderPrivateKey)
        const keysharesArr = Object.values(keyshares)
        console.log("keyshares", keysharesArr.map(crypto.keyShareToBase64))
        // encrypt them so only the desired staker can read it
        const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyshares, uploaderPrivateKey, stakePublicKeys)
        console.log("encryptedKeyShares", encryptedKeyShares)
        // send to backend
        const newSecret = await hackathon.addSecret(encryptedSecret, uploaderPublicKey, input.rewardInt,
            input.expiryTimeInUTCSecs, input.heartbeatFreqInt, encryptedKeyShares, principals, stakeIds)
        
        console.log("newSecret", newSecret)
        if (newSecret.length > 0) {
            alert(`Secret with ID ${newSecret[0].secret_id} uploaded!`)
        }

        listAllSecrets()
    }

    ///////////////////////////// TESTS /////////////////////////////

    // TODO move to a test file

    function testSecretEnDecryption() {
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const secret = 'very secret'
        const encryptedSecret = crypto.encryptSecret(secret, uploaderPrivateKey)
        const plaintext = crypto.decryptSecret(encryptedSecret, uploaderPrivateKey)
        console.log('testSecretEnDecryption', secret == plaintext)
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
         const share1 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[0], staker1PrivateKey, uploaderPublicKey))
         const share2 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[1], staker2PrivateKey, uploaderPublicKey))
         const share3 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[2], staker3PrivateKey, uploaderPublicKey))
         
         const shares = {1: share1, 2: share2}
         const reconstructedPrivateKey = crypto.reconstructPrivateKey(shares)
         // can still reconstruct
         console.log("testSharingAndReconstruction", reconstructedPrivateKey == uploaderPrivateKey)
    }

    async function listAllSecrets() {
    
        let secrets = await hackathon.listSecrets(identity.getPrincipal())
        secrets.sort(function(a, b) { 
          return - (parseInt(b.secret_id) - parseInt(a.secret_id));
        });
    
        console.log("Secrets", secrets)
    
        const table = document.getElementById('secretsTable')
    
        const col_names = ['secret_id', 'n_shares', 'n_revealed', 'expiry_time', 'last_heartbeat']
        table.innerHTML = ''
    
        const tr = table.insertRow(-1)
        for (const cn of col_names) {
          const tabCell = tr.insertCell(-1)
          tabCell.innerHTML = cn
        }
    
        secrets.map(function (s) {
          const tr = table.insertRow(-1)
    
          const idCell = tr.insertCell(-1)
          idCell.innerHTML = s.secret_id
    
          const sharesCell = tr.insertCell(-1)
          sharesCell.innerHTML = s.shares.length
    
          const revealedCell = tr.insertCell(-1)
          revealedCell.innerHTML = s.revealed.reduce((a,b) => a + b, 0)
    
        
          const expiryCell = tr.insertCell(-1)
          expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()

          const heartbeatCell = tr.insertCell(-1)
          heartbeatCell.innerHTML = helpers.secondsSinceEpocheToDate(s.last_heartbeat).toLocaleString()
        });
    }

    async function sendHeartbeat() {
        let done = await hackathon.sendHeartbeat()
        console.log("Sent hearbeat?", done)
        listAllSecrets()
    }
    
    React.useEffect(() => {
        listAllSecrets()
      })


    return (
        <div>
            <h1>Uploader</h1>

            <div class="panel">
                <h2>My Secrets</h2>
                <table id="secretsTable" cellPadding={5}/>
            </div>

            <div class="panel">
                <h2>Heartbeat</h2>
                <button onClick={() => sendHeartbeat()}>Everybody stay calm! I'm still alive!</button>
            </div>

            <div class="panel">
                <label htmlFor="secret">Your secret to be published:</label>
                <br/>
                <textarea id="secret" type="text" onChange={(ev) => setSecret(ev.target.value)} rows="10" cols="50"/>
                <br/>

                <label htmlFor="reward">Reward stakers opening your secret with</label>
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
        </div>
        )
    }