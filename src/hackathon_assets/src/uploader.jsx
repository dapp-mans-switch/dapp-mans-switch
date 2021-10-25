import * as React from 'react'
import { render } from 'react-dom'
import * as crypto from './crypto'
import sha256 from 'js-sha256'
import * as helpers from './helpers'
import routToPage from './router'
import { render } from 'react-dom'
import Wallet from './wallet'
import { min } from 'mathjs'

import stillAliveVideo from './../assets/im_alive.mkv'
import backButtonVideo from './../assets/back_button.mkv'
import {appendLoadingAnimation, removeLoadingAnimation} from './loadingAnimation'

const TEST = false

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
        // disable upload button to prevent multi upload
        let uploadButton = document.getElementById('secret_btn')
        uploadButton.style.pointerEvents = "none"

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
                alert('Please check your input: ' + error)
                removeLoadingAnimation()
                // re-enable upload button
                uploadButton.style.pointerEvents = "auto"
                return
            }
        }

        // uploader generates a fresh key pair
        const uploaderKeyPair = crypto.generateKeyPair()
        const uploaderPrivateKey = uploaderKeyPair.privateKey
        const uploaderPublicKey = uploaderKeyPair.publicKey

        // encrypt the secret
        const encryptedSecret = crypto.encryptSecret(input.secret, uploaderPrivateKey)

        const number_of_shares = min(input.rewardInt, 255); // for now 1 token/stake payout, 255 is maximum crypto.js can handle

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
            // re-enable upload button
            uploadButton.style.pointerEvents = "auto"
            return
        }

        console.log("Stakes", stakes)
        if (stakes.length == 0) {
            // should not be possible, handled above
            alert("Not enough stakes in system (have to be different from author)")
            // re-enable upload button
            uploadButton.style.pointerEvents = "auto"
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
            input.expiryTimeInUTCSecs, input.heartbeatFreqInt * 86400, encryptedKeyShares, keysharesShas, stakeIds)


        removeLoadingAnimation()
        listAllSecrets()
        window.getBalance()

        if ('ok' in addSecretResult) {
            let newSecret = addSecretResult['ok']
            console.log("newSecret", newSecret)
            alert(`Secret with ID ${newSecret.secret_id} uploaded!`)
            // reset form after successful upload
            setSecret(null)
            setReward(null)
            setExpiryTime(null)
            setHeartbeatFreq(null)
            document.getElementById('uploader_form').reset()
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
        // re-enable upload button
        uploadButton.style.pointerEvents = "auto"
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

        let secretsWithInfo = await hackathon.listMySecretsPlusRevealInfo()
        secretsWithInfo.sort(function(a, b) {
          return - (parseInt(b[0].secret_id) - parseInt(a[0].secret_id));
        });

        const tableAlive = document.getElementById('secretsTableAlive')
        const tableReveal = document.getElementById('secretsTableReveal')

        tableAlive.innerHTML = ''
        const tr = tableAlive.insertRow(-1)
        for (const cn of ['Secret ID', 'Expiry time', 'Heartbeat']) {
          const tabCell = tr.insertCell(-1)
          tabCell.innerHTML = cn
        }

        tableReveal.innerHTML = ''

        const tr2 = tableReveal.insertRow(-1)
        for (const cn of  ['Secret ID', 'Expiry time', 'Progress']) {
          const tabCell = tr2.insertCell(-1)
          tabCell.innerHTML = cn
        }

        secretsWithInfo.map(function (x) {
            let s = x[0]
            let revealInProgress = x[1]
            //console.log(s, revealInProgress)

            let tr
            if (revealInProgress) {
                tr = tableReveal.insertRow(-1)
            } else {
                tr = tableAlive.insertRow(-1)
            }

            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id

            let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const expiryCell = tr.insertCell(-1)
            expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString('en-GB', options)

            if (revealInProgress) {
                let n_shares = s.shares.length;
                let n_revealed = s.revealed.reduce((a,b) => a + b, 0);

                const progressCell = tr.insertCell(-1)
                const minReveal = crypto.minSharesToRecover(n_shares)
                progressCell.innerHTML = (min(n_revealed, minReveal)  / minReveal * 100.0).toLocaleString(undefined, { minimumFractionDigits: 2}) + " %"
            } else {
                let now = new Date()
                let next_heartbeat = helpers.secondsSinceEpocheToDate(s.last_heartbeat + s.heartbeat_freq)
                //console.log("next_heartbeat", next_heartbeat)
                let remainingTimeMS = next_heartbeat - now
                let remainingTimeHR = remainingTimeMS / 1000 / 60 / 60
                const heartbeatCell = tr.insertCell(-1)
                heartbeatCell.innerHTML = remainingTimeHR.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2}) + " h"

                if (remainingTimeHR < 12) {
                    heartbeatCell.style.color = '#ed2939';
                }
            }
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

    async function checkAvailability() {
        try {
            const expiryTimeInUTCSecs = (new Date(expiryTime)).getTime() / 1_000
            const rewardInt = helpers.getPositiveNumber(reward)

            if (isNaN(expiryTimeInUTCSecs)) {
                return
            }
            console.log("here")
            let nAvailableStakes = await hackathon.getAvailableStakes(expiryTimeInUTCSecs)
            let secretPrice = await hackathon.getSecretBasePrice()
            console.log("nAvailableStakes", nAvailableStakes)
            console.log("Cost", rewardInt + Number(secretPrice))

        } catch (error) {
            alert('Input positive reward and date!')
        }
    }

    async function createWallet() {
        render(React.createElement(Wallet, props), document.getElementById('my-wallet'))
    }

    React.useEffect(() => {
        window.scrollTo(0,0);
        listAllSecrets()
        createWallet()
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
                    <p>Post your Secrets here.</p>
                    <p>Paying higher rewards incentivizes stakers to keep your Secret secure.</p>
                </div>
                <div id="my-wallet"/>
            </div>

            <div className="panel">
                <h3>Heartbeat</h3>
                <a data-text="Everybody stay calm! I'm still alive!" onClick={sendHeartbeat} className="rainbow-button" style={{width: 550}}/>
                <video id="still-alive-video" className="still-alive-video">
                    <source src={stillAliveVideo}/>
                </video>
            </div>

            <div className="panel">
                <h3>My Secrets</h3>
                <b>Alive</b>
                <table id="secretsTableAlive" cellPadding={5}/>
                <b>Reveal in Progress</b>
                <table id="secretsTableReveal" cellPadding={5}/>
            </div>

            <div className="panel">
              <form id="uploader_form">
                <h3>Upload a new Secret</h3>
                <textarea id="secret" type="text" autoComplete='off' onChange={(ev) => setSecret(ev.target.value)}/>
                <br/>

                <label htmlFor="reward">Reward ($HRBT)</label>
                <span><input id="reward" type="number" autoComplete='off' onChange={(ev) => setReward(ev.target.value)}/></span>

                <label htmlFor="heartbeatFreq">Heartbeat frequency (days)</label>
                <span><input id="heartbeatFreq" type="number" autoComplete='off' onChange={(ev) => setHeartbeatFreq(ev.target.value)}/></span>

                <label htmlFor="expiryTime">Latest reveal date:</label>
                <span><input id="expiryTime" type="datetime-local" autoComplete='off' onChange={(ev) => setExpiryTime(ev.target.value)}/></span>

                <a id="secret_btn" data-text="Upload secret" autoComplete='off' onClick={uploadSecret} className="rainbow-button" style={{width: 260}}/>
              </form>

                <button onClick={checkAvailability}>Check availability</button>
            </div>

            <a onClick={() => {routToPage('Main')}}>
                <video autoPlay loop muted class="back-button-big">
                    <source src={backButtonVideo}/>
                </video>
            </a>

        </div>
        )
    }
