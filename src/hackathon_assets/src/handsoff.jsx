import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import * as crypto from './crypto'

export default function HandsOff(props) {

    const auth = props.auth;
    const hackathon = props.canisters.hackathon;
    const token = props.canisters.token;
    const privateKey = props.privateKey;

    let consoleStrs = [];

    loopBody()
    const interval = setInterval(loopBody, 30 * 1000)

    function printToConsole(str) {
        let buffer_size = 20

        let now = (new Date()).toLocaleString()
        const handsOffConsole = document.getElementById('hands_off_console')
        consoleStrs.push(`[${now}] ` + str)
        if (consoleStrs.length > buffer_size) {
            consoleStrs.shift()
        }
        let consoleStr = consoleStrs.join('\n')

        handsOffConsole.innerText = consoleStr
    }

    async function endStakesIfNecessary() {
        let stakes = await hackathon.listMyStakes()

        let now = new Date() / 1000
        let validStakes = 0
        let stakesToEnd = []

        stakes.map(function (s) {
            if (s.valid) {
                validStakes += 1
            }
            if (s.expiry_time > now) {
                stakesToEnd.push(s)
            }
        })

        printToConsole(`Found ${validStakes} valid stakes. There are ${stakesToEnd.length} stake(s) to end.`)

        stakesToEnd.map(endStake)
    }

    async function endStake(stake) {
        let stake_id = stake['stake_id']
        const result = await hackathon.endStake(stake_id)
        if ('ok' in result) {
            printToConsole(`End stake ${stake_id} OK: Received $HRBT ${result['ok']['payout']}.`)
        }
        if ('err' in result) {
            printToConsole(`End stake ${stake_id} FAILED: ${result['err']}`)
        }
    }

    async function revealSecretsIfNecessary() {
        let relevantSecrets = await hackathon.listRelevantSecrets()

        let activeSecrets = 0
        let expiredSecrets = []
        let shouldRevealSecrets = []
        relevantSecrets.map(function (s) {
            if (s.shouldReveal) {
                if (!s.hasRevealed) {
                    // reveal
                    shouldRevealSecrets.push(s)
                }
            } else {
                if (!s.hasPayedout) {
                    if (s.expiry_time < new Date() / 1000) {
                        // expired secret, can request payout
                        expiredSecrets.push(s)
                    } else {
                        // secret author still alive
                        activeSecrets += 1
                    }
                }
            }
        })
        printToConsole(`Found ${activeSecrets} active secret(s).\n`+
            `\tThere are ${expiredSecrets.length} expired secret(s) for which we can request payout.\n` +
            `\tThere are ${shouldRevealSecrets.length} secret(s) for which we should reveal our share.`)

        expiredSecrets.map(requestPayout)
        shouldRevealSecrets.map(revealSecret)
    }

    async function requestPayout(secret) {
        let secretId = secret.secret_id
        const result = await hackathon.requestPayout(secretId)
        if ('ok' in result) {
            printToConsole(`Request payout for secret ${secretId} OK: Received $HRBT ${result['ok']}.`)
        }
        if ('err' in result) {
            printToConsole(`Request payout for secret ${secretId} FAILED: ${result['err']}.`)
        }
    }

    async function revealSecret(secret) {
        const backendPublicKey = await hackathon.lookupMyPublicKey()
        let decryptedShares = []
        try {
            const uploaderPublicKey = secret['uploader_public_key']
            console.log(privateKey)
        
            for (let j = 0; j < secret.relevantShares.length; j++) {
                decryptedShares.push(crypto.decryptKeyShare(secret.relevantShares[j], privateKey, uploaderPublicKey))
            }
            console.log("decryptedShares", decryptedShares)
        } catch (error) {
            console.log(`Failed decryption: ${error}`)
            printToConsole(`Reveal secret ${secret.secret_id} FAILED: ${error}.`)
            return
        }
        
        let result = await hackathon.revealAllShares(secret.secret_id, decryptedShares);
        if ('ok' in result) {
            printToConsole(`Reveal secret ${secret.secret_id} OK: Received $HRBT ${result['ok']['payout']}`)
        } else if ('err' in result) {
            printToConsole(`Reveal secret ${secret.secret_id} FAILED: ${result['err']}`)
        }
    }

    async function printBalance() {
        let balance = await token.myBalance()
        printToConsole(`Current balance: $HRBT ${balance}.`)
    }

    async function loopBody() {
        await printBalance()
        endStakesIfNecessary()
        revealSecretsIfNecessary()
    }

    function stop() {
        clearInterval(interval)
        console.log('stop')
        // routToPage('Main')
    }


    React.useEffect(async () => {
    }, [])

    return (
    <div className="eventHorizon">
        <h1>Hands-Off Mode</h1>
        <h2>{privateKey}</h2>
        <a id="stop_button" data-text="Stop" onClick={stop} className="rainbow-button" style={{width: 100}}></a>

        <p id='hands_off_console' align='left' style={{'whiteSpace': 'pre-wrap'}}></p>
    </div>
    )
}