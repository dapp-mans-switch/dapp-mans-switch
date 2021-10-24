import * as React from 'react'
import * as crypto from './crypto'
import sha256 from 'js-sha256'
import * as helpers from './helpers'
import routToPage from './router'

import stillAliveVideo from './../assets/im_alive.mkv'
import backButtonVideo from './../assets/back_button.mkv'
import {appendLoadingAnimation, removeLoadingAnimation} from './loadingAnimation'

const TEST = true

export default function Uploader(props) {
    const hackathon = props.canisters.hackathon;
    const token = props.canisters.token;

    const [secret, setSecret] = React.useState('')
    const [reward, setReward] = React.useState('')
    const [expiryTime, setExpiryTime] = React.useState('')
    const [heartbeatFreq, setHeartbeatFreq] = React.useState('')

    function validateInput(secret, reward, expiryTime, heartbeatFreq) {
        if (secret == '') {
            throw 'secret must not be empty'
        }
        const expiryTimeInUTCSecs = (new Date(expiryTime)).getTime() / 1_000
        if (isNaN(expiryTimeInUTCSecs)) {
            throw 'expiryTime must not be empty'
        }
        // TODO validate expirytime input properly
        // also make sure the date is more than 1 heartbeat in the future?
        const nowInUTCSecs = (new Date().getTime()) / 1_000
        if (expiryTimeInUTCSecs - nowInUTCSecs <= 0) {
          throw 'expiryTime must be in the future'
        }
        const rewardInt = helpers.getPositiveNumber(reward)
        const heartbeatFreqInt = helpers.getPositiveNumber(heartbeatFreq)
        return {secret, rewardInt, expiryTimeInUTCSecs, heartbeatFreqInt}
    }

    async function uploadSecret() {
        appendLoadingAnimation("uploader_form", false)
        let input
        if (TEST) {
            testSecretEnDecryption()
            testSharingAndReconstruction()
            input = {'secret': 'My top secret.', 'rewardInt': 10, 'expiryTimeInUTCSecs': 1634429840, 'heartbeatFreqInt': 1}
        } else {
            try {
                input = validateInput(secret, reward, expiryTime, heartbeatFreq)
            } catch (error) {
                console.log(error)
                alert('Please check your input!')
                removeLoadingAnimation()
                return
            }
        }

        // clear form to prevent multi upload
        document.getElementById('uploader_form').reset()

        // uploader generates a fresh key pair
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const uploaderPublicKey = uploaderKeyPair.publicKey

        // encrypt the secret
        const encryptedSecret = crypto.encryptSecret(input.secret, uploaderPrivateKey)

        const number_of_shares = input.rewardInt; // TODO: ok?, limit reward?

        // choose stakers
        // const stakes = await helpers.drawStakes() // <- fails now with this
        const result = await hackathon.drawStakes(input.expiryTimeInUTCSecs, number_of_shares);
        let stakes
        if ('ok' in result) {
            stakes = result['ok']
        }
        if ('err' in result) {
            alert(`There are no stakes for the set expiry time!`)
            console.error(result['err'])
            removeLoadingAnimation()
            return
        }

        console.log("Stakes", stakes)
        if (stakes.length == 0) {
            // should not be possible, handled above
            alert("Not enough stakes in system (have to be different from author)")
            return
        }

        const stakePublicKeys = helpers.getPublicKeysOfStakes(stakes)
        const stakeIds = helpers.getIdsOfStakes(stakes)
        console.log("StakeIds", stakeIds)

        // create shares of the private key
        const keyshares = crypto.computeKeyShares(uploaderPrivateKey, number_of_shares)
        const keysharesBase64 = Object.values(keyshares).map(crypto.keyShareToBase64)
        console.log("keysharesBase64", keysharesBase64)

        const keysharesShas = keysharesBase64.map(sha256);
        console.log("keysharesShas", keysharesShas)

        // encrypt them so only the desired staker can read it
        const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyshares, uploaderPrivateKey, stakePublicKeys)
        console.log("encryptedKeyShares", encryptedKeyShares)

        // tokenomics
        let secretBasePrice = Number(await hackathon.getSecretBasePrice());
        let hackathonID = await hackathon.identity();
        let ok = await token.approve(hackathonID, input.rewardInt + secretBasePrice, []); // should not throw error

        // send to backend
        const addSecretResult = await hackathon.addSecret(encryptedSecret, uploaderPublicKey, input.rewardInt,
            input.expiryTimeInUTCSecs, input.heartbeatFreqInt, encryptedKeyShares, keysharesShas, stakeIds)

        
        removeLoadingAnimation()
        listAllSecrets()

        if ('ok' in addSecretResult) {
            let newSecret = addSecretResult['ok']
            console.log("newSecret", newSecret)
            alert(`Secret with ID ${newSecret.secret_id} uploaded!`)
        }
        if ('err' in addSecretResult) {
            const err = addSecretResult['err']
            if ('invalidStakes' in err) {
                alert(`Could not upload secret: Uploaded invalid stakes!`) // should not happen as we draw stakes from backend above
            } else if ('invalidReward' in err) {
                alert(`Could not upload secret: Invalid reward ${err['invalidReward']}!`) // should not happen as we validate input
            } else if ('invalidHeartbeatFreq' in err) {
                alert(`Could not upload secret: Invalid heatbeat frequency ${err['invalidHeartbeatFreq']}!`) // should not happen as we validate input
            } else if ('invalidListLengths' in err) {
                alert(`Could not upload secret: Lengths of lists should be the same!`) // should not happen
            } else if ('invalidPublicKey' in err) {
                alert(`Could not upload secret: Invalid public key!`) // should not happen as we get it from crypto.js
            } else if ('transferError' in err) {
                alert(`Transfer error: ${err['transferError']}`)
            } else {
                alert(`Something went wrong!`)
            }
            console.error(err)
        }
        
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

         const keyshares = crypto.computeKeyShares(uploaderPrivateKey, 3)
         const encryptedKeyShares = crypto.encryptMultipleKeyShares(keyshares, uploaderPrivateKey, stakerPublicKeys)
 
         // lets say 1 of the 3 keyshares got lost
         const share1 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[0], staker1PrivateKey, uploaderPublicKey))
         const share2 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[1], staker2PrivateKey, uploaderPublicKey))
         const share3 = crypto.base64ToKeyShare(crypto.decryptKeyShare(encryptedKeyShares[2], staker3PrivateKey, uploaderPublicKey))
         
         const shares = {1: share1, 3: share3}
         const reconstructedPrivateKey = crypto.reconstructPrivateKey(shares)
         // can still reconstruct
         console.log("testSharingAndReconstruction", reconstructedPrivateKey == uploaderPrivateKey)
    }


    async function listAllSecrets() {
    
        let secrets = await hackathon.listMySecrets()
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
        let aliveVideo = document.getElementById("still-alive-video")
        aliveVideo.style.display = "flex"
        aliveVideo.play()
        aliveVideo.addEventListener("ended", (event) => {
            aliveVideo.style.display = "none"
        })
        let done = await hackathon.sendHeartbeat()
        console.log("Sent hearbeat?", done)
        listAllSecrets()
    }

    // hide video when finished playing
    function hideVideo() {
        let aliveVideo = document.getElementById("still-alive-video")
        aliveVideo.style.display = "none"
    }
    
    React.useEffect(() => {
        listAllSecrets()
      }, [])


    return (
        <div class="eventHorizon">
            <div class="header-n-nav">
                <a onClick={() => {routToPage('Main')}}>
                    <video autoPlay loop muted class="back-button-video">
                        <source src={backButtonVideo}/>
                    </video>
                </a>
                <h1>Uploader</h1>
            </div>
        
            <div class="description-and-wallet">
                <div class="description">
                    <p>Post your secrets here.</p>
                    <p>Paying higher rewards incentivises more staker to keep your secret secure.</p>
                </div>
                <div class="wallet-in-app">
                <div>
                    <p>Balance:</p>
                    <b>300 $HRBT</b>
                </div>
                <div>
                    <button>Top Up + 100 $HRBT</button>
                </div>
                </div>
            </div>

            <div className="panel">
                <h3>My Secrets</h3>
                <table id="secretsTable" cellPadding={5}/>
            </div>

            <div className="panel">
                <h3>Heartbeat</h3>
                <a data-text="Everybody stay calm! I'm still alive!" onClick={sendHeartbeat} className="rainbow-button" style={{width: 550}}/>
                <video id="still-alive-video" className="still-alive-video">
                    <source src={stillAliveVideo}/>
                </video>
            </div>

            <div className="panel">
              <form id="uploader_form">
                <h3>Create a Sectret to be published</h3>
                <textarea id="secret" type="text" autoComplete='off' onChange={(ev) => setSecret(ev.target.value)}/>
                <br/>

                <label htmlFor="reward">Reward ($HRBT)</label>
                <span><input id="reward" type="number" autoComplete='off' onChange={(ev) => setReward(ev.target.value)}/></span>

                <label htmlFor="heartbeatFreq">Heartbeat Frequency (Days)</label>
                <span><input id="heartbeatFreq" type="number" autoComplete='off' onChange={(ev) => setHeartbeatFreq(ev.target.value)}/></span>

                <label htmlFor="expiryTime">Latest Reveal Date:</label>
                <span><input id="expiryTime" type="datetime-local" autoComplete='off' onChange={(ev) => setExpiryTime(ev.target.value)}/></span>

                <a id="secret_btn" data-text="Upload secret" autoComplete='off' onClick={uploadSecret} className="rainbow-button" style={{width: 260}}/>
              </form>
            </div>

            <a onClick={() => {routToPage('Main')}}>
                <video autoPlay loop muted class="back-button-video">
                    <source src={backButtonVideo}/>
                </video>
            </a>
            
        </div>
        )
    }
