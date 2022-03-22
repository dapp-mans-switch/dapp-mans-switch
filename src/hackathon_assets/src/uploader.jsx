import * as React from 'react'
import { render } from 'react-dom'
import * as crypto from './crypto'
import sha256 from 'js-sha256'
import * as helpers from './helpers'
import routToPage from './router'
import Wallet from './wallet'
import { min } from 'mathjs'
import { errorPopup } from './errorPopup'

import stillAliveVideoMov from './../assets/im-alive.mov'
import stillAliveVideoWebm from './../assets/im-alive.webm'
import backButtonVideoMov from './../assets/back-button.mov'
import backButtonVideoWebm from './../assets/back-button.webm'
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
        // secret
        if (secret == '') {
            throw 'Secret must not be empty.'
        }

        // heartbeat frequency
        const heartbeatFreqInt = helpers.getPositiveNumber(heartbeatFreq)

        // reward
        const rewardInt = helpers.getPositiveNumber(reward)
        if (rewardInt <= 1) {
            throw 'Reward must be an integer larger than 1.'
        }

        // expiration date
        const expiryTimeInUTCSecs = (new Date(expiryTime)).getTime() / 1_000
        if (isNaN(expiryTimeInUTCSecs)) {
            throw 'Expiration date must be set.'
        }
        const nowInUTCSecs = (new Date().getTime()) / 1_000
        if (expiryTimeInUTCSecs - nowInUTCSecs <= 0) {
            throw 'Expiration date must be in the future.'
        }
        const heartbeatFreqInSecs = heartbeatFreqInt * (24*60*60)
        if ((expiryTimeInUTCSecs - nowInUTCSecs) - heartbeatFreqInSecs <= 60) {
            throw 'Expiration date must be more than 1 heatbeat in the future.'
        }

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
                errorPopup('Please check your input: ' + error, 'secret_btn')
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

        const number_of_shares = min(input.rewardInt, 255); // 255 is maximum shamir.js can handle

        // choose stakers
        // const stakes = await helpers.drawStakes() // <- fails now with this
        const result = await hackathon.drawStakes(input.expiryTimeInUTCSecs, number_of_shares);
        let stakes
        if ('ok' in result) {
            stakes = result['ok']
        }
        if ('err' in result) {
            errorPopup(`There are no stakes for the set expiry time!`, 'secret_btn')
            console.error(result['err'])
            removeLoadingAnimation()
            // re-enable upload button
            uploadButton.style.pointerEvents = "auto"
            return
        }

        console.log("Stakes", stakes)
        if (stakes.length == 0) {
            // should not be possible, handled above
            errorPopup("Not enough stakes in system (have to be different from author)", 'secret_btn')
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
        await token.approve(hackathonID, input.rewardInt + secretBasePrice, []); // should not throw error

        // send to backend
        const addSecretResult = await hackathon.addSecret(encryptedSecret, uploaderPublicKey, input.rewardInt,
            input.expiryTimeInUTCSecs, input.heartbeatFreqInt * 86400, encryptedKeyShares, keysharesShas, stakeIds)

        removeLoadingAnimation()
        listAllSecrets()
        window.getBalance()

        if ('ok' in addSecretResult) {
            let newSecret = addSecretResult['ok']
            console.log("newSecret", newSecret)
            errorPopup(`Secret with ID ${newSecret.secret_id} uploaded!`, 'secret_btn', true, false)
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
                errorPopup(`Could not upload secret: Uploaded invalid stakes!`, 'secret_btn') // should not happen as we draw stakes from backend above
            } else if ('invalidReward' in err) {
                errorPopup(`Could not upload secret: Invalid reward ${err['invalidReward']}!`, 'secret_btn') // should not happen as we validate input
            } else if ('invalidHeartbeatFreq' in err) {
                errorPopup(`Could not upload secret: Invalid heatbeat frequency ${err['invalidHeartbeatFreq']}!`, 'secret_btn') // should not happen as we validate input
            } else if ('invalidListLengths' in err) {
                errorPopup(`Could not upload secret: Lengths of lists should be the same!`, 'secret_btn') // should not happen
            } else if ('invalidPublicKey' in err) {
                errorPopup(`Could not upload secret: Invalid public key!`, 'secret_btn') // should not happen as we get it from crypto.js
            } else if ('transferError' in err) {
                errorPopup(`Transfer error: ${err['transferError']}`, 'secret_btn')
            } else {
                errorPopup(`Something went wrong!`, 'secret_btn')
            }
            console.error(err)
        }
        // re-enable upload button
        uploadButton.style.pointerEvents = "auto"
    }

    const interval = setInterval(listAllSecrets, 30*1000)

    async function listAllSecrets() {
        console.log("listAllSecrets")

        let secretsWithInfo = await hackathon.listMySecretsPlusRevealInfo()
        secretsWithInfo.sort(function(a, b) {
            return - (parseInt(b[0].secret_id) - parseInt(a[0].secret_id));
        });
        //console.log("secretsWithInfo", secretsWithInfo)

        const tableAlive = document.getElementById('secretsTableAlive')
        const tableReveal = document.getElementById('secretsTableReveal')
        const tableExpired = document.getElementById('secretsTableExpired')

        tableAlive.innerHTML = ''
        const tr = tableAlive.insertRow(-1)
        for (const cn of ['<b>ID<b/>', '<b>Expires on<b/>', '<b>Heartbeat<b/>']) {
            const tabCell = tr.insertCell(-1)
            tabCell.innerHTML = cn
        }

        tableReveal.innerHTML = ''
        const tr2 = tableReveal.insertRow(-1)
        for (const cn of  ['<b>ID<b/>', '<b>Expires on<b/>', '<b>Progress<b/>']) {
            const tabCell = tr2.insertCell(-1)
            tabCell.innerHTML = cn
        }

        tableExpired.innerHTML = ''
        const tr3 = tableExpired.insertRow(-1)
        for (const cn of  ['<b>ID<b/>', '<b>Expired on<b/>', "&nbsp".repeat(16)]) {
            const tabCell = tr3.insertCell(-1)
            tabCell.innerHTML = cn
        }

        let now = new Date()

        secretsWithInfo.map(function (x) {
            let s = x[0]
            let revealInProgress = x[1]
            //console.log(s, revealInProgress)

            let tr
            if (revealInProgress) {
                // reveal in progress
                tr = tableReveal.insertRow(-1)
            } else {
                if (Number(s.expiry_time)*1000 < now) {
                    // expired
                    tr = tableExpired.insertRow(-1)
                } else {
                    // alive
                    tr = tableAlive.insertRow(-1)
                }
            }

            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id

            const expiryCell = tr.insertCell(-1)
            expiryCell.innerHTML = helpers.secondsSinceEpocheToISO8601(s.expiry_time)

            if (revealInProgress) {
                // reveal in progress
                let n_shares = s.shares.length;
                let n_revealed = s.revealed.reduce((a,b) => a + b, 0);

                const progressCell = tr.insertCell(-1)
                const minReveal = crypto.minSharesToRecover(n_shares)
                progressCell.innerHTML = (min(n_revealed, minReveal)  / minReveal * 100.0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2}) + " %"
            } else {
                if (Number(s.expiry_time)*1000 < now) {
                    // expired

                } else {
                    // alive
                    let next_heartbeat = new Date(Number(s.last_heartbeat + s.heartbeat_freq) * 1000)
                    let remainingTimeMS = next_heartbeat - now
                    let remainingTimeHR = remainingTimeMS / 1000 / 60 / 60
                    const heartbeatCell = tr.insertCell(-1)

                    function pad(n) {return n<10 ? '0'+n : n}
                    // hh:mm
                    heartbeatCell.innerHTML = Math.floor(remainingTimeHR) + ":" + pad(Math.floor((remainingTimeHR % 1) * 60)) + " h"

                    if (remainingTimeHR < 12) {
                        heartbeatCell.style.color = '#ed2939';
                    }
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
            errorPopup('Input positive reward and date!', 'availability-btn')
        }
    }

    async function createWallet() {
        render(React.createElement(Wallet, props), document.getElementById('my-wallet'))
    }

    window.onpopstate = goBack
    history.pushState({}, '')

    React.useEffect(() => {
        window.scrollTo(0,0);
        listAllSecrets()
        createWallet()
    }, [])

    function goBack() {
        console.log("End interval", interval)
        clearInterval(interval)
        routToPage('Main')
    }

    return (
        <div className="content">
        <div className="header-n-nav">
        <a onClick={goBack}>
            <video autoPlay loop muted className="back-button-video">
                <source src={backButtonVideoMov}/>
                <source src={backButtonVideoWebm}/>
            </video>
        </a>
        <h1>Uploader</h1>
        </div>

        <div className="description-and-wallet">
            <div className="description">
                <p>Post your Secrets here and regularly send a Heartbeat. Otherwise the Stakers will publish your Secret.</p>
            </div>
            <div className="full-child-wallet">
                <div id="my-wallet"/>
            </div>
        </div>

        <div className="panel">
        <h3>Heartbeat</h3>
        <a data-text="Everybody stay calm! I'm still alive!" onClick={sendHeartbeat} className="big-still-alive-button rainbow-button" style={{width: 550}}/>
        <a data-text="I'm still alive!" onClick={sendHeartbeat} className="small-still-alive-button rainbow-button" style={{width: 220}}/>
        <video id="still-alive-video" className="still-alive-video">
            <source src={stillAliveVideoMov}/>
            <source src={stillAliveVideoWebm}/>
        </video>
        </div>

        <div className="panel">
        <h3>My Secrets</h3>
        <br/>
        <b>Alive</b>
        <table id="secretsTableAlive" cellPadding={5}/>
        <br/>
        <b>Reveal in Progress</b>
        <table id="secretsTableReveal" cellPadding={5}/>
        <br/>
        <b>Expired</b>
        <table id="secretsTableExpired" cellPadding={5}/>
        </div>

        <div className="panel">
        <form id="uploader_form">
        <h3>Upload a new Secret</h3>
        <textarea id="secret" type="text" autoComplete='off' onChange={(ev) => setSecret(ev.target.value)}/>
        <br/>

        <label htmlFor="reward">Reward in $HRBT</label>
        <span><input id="reward" type="number" autoComplete='off' onChange={(ev) => setReward(ev.target.value)}/></span>

        <label htmlFor="heartbeatFreq">Heartbeat frequency in days</label>
        <span><input id="heartbeatFreq" type="number" autoComplete='off' onChange={(ev) => setHeartbeatFreq(ev.target.value)}/></span>

        <label htmlFor="expiryTime">Expiration date:</label>
        <span><input id="expiryTime" type="datetime-local" autoComplete='off' onChange={(ev) => setExpiryTime(ev.target.value)}/></span>

        <a id="secret_btn" data-text="Upload secret" autoComplete='off' onClick={uploadSecret} className="rainbow-button" style={{width: 220}}/>
        </form>

        {/* <button id="availability-btn" onClick={checkAvailability}>Check availability</button> */}
        </div>

        <a onClick={goBack}>
            <video autoPlay loop muted className="back-button-big">
                <source src={backButtonVideoMov}/>
                <source src={backButtonVideoWebm}/>
            </video>
        </a>

        </div>
    )
}
