import * as React from 'react'
import { render } from 'react-dom'
import routeToPage from './router'
import * as crypto from './crypto'
import * as helpers from './helpers'

export default function HandsOff(props) {

    const auth = props.auth;
    const hackathon = props.canisters.hackathon;
    const token = props.canisters.token;
    const privateKey = props.privateKey;

    let consoleStrs = [];

    loopBody()
    const interval = setInterval(loopBody, 60 * 1000) // run main loop once a minute

    function printToConsole(str) {
        let buffer_size = 1327 // it's prime !

        let nowInSeconds = (new Date() / 1000)
        let now = helpers.secondsSinceEpocheToISO8601(nowInSeconds)

        const handsOffConsole = document.getElementById('hands_off_console')
        consoleStrs.unshift([`[${now}] ` + str])
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

                if (s.expiry_time < now) {
                    stakesToEnd.push(s)
                }
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
            console.log('endStake:', result['err'])
            // TODO: refactor
            let errMsg = ''
            if ('stakeNotFound' in err) {
                let stake_id = err['stakeNotFound']
                errMsg = `Stake with id ${stake_id} was not found!`
              } else if ('permissionDenied' in err) {
                errMsg = `You don't have permission to end this stake.`
              } else if ('alreadyPayedOut' in err) {
                errMsg = `Stake was already ended and payed out!`
              } else if ('insufficientFunds' in err) {
                errMsg = `Insufficient funds: ${err['insufficientFunds']}`
              } else {
                errMsg = `Something went wrong!`
              }
            printToConsole(`End stake ${stake_id} FAILED: ${errMsg}`)
        }
    }

    async function revealSecretsIfNecessary() {
        let relevantSecrets = await hackathon.listRelevantSecrets()

        let activeSecrets = 0
        let expiredSecrets = []
        let shouldRevealSecrets = []
        relevantSecrets.map(function (s) {
            if (s.shouldReveal) {
                if (!s.hasRevealed && !s.hasPayedout) {
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
            // TODO: refactor
            let errMsg = ''
            if ('alreadyPayedOut' in err) {
                errMsg = `The reward for these key-shares was already payed out!`
              } else if ('shouldReveal' in err) {
                errMsg = `You should reveal the shares of this secret, not request payout!`
              } else if ('insufficientFunds' in err) {
                errMsg = `Insufficient funds: ${err['insufficientFunds']}`
              } else {
                errMsg = `Something went wrong!`
              }
            console.log('requestPayout:', result['err'])
            printToConsole(`Request payout for secret ${secretId} FAILED: ${errMsg}.`)
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
            console.log('revealSecret:', result['err'])
            // TODO: refactor
            let errMsg = ''
            if ('secretNotFound' in err) {
                errMsg = `Secret with id ${err['secretNotFound']} was not found!`
              } else if ('invalidDecryptedSHA' in err) {
                errMsg = `SHA of decrypted share did not match!`
              } else if ('wrongNumberOfShares' in err) {
                errMsg = `Invalid number of shares uploaded!`
              } else if ('alreadyRevealed' in err) {
                errMsg = `You have already revealed this secret!`
              } else if ('insufficientFunds' in err) {
                errMsg = `Insufficient funds: ${err['insufficientFunds']}`
              } else if ('shouldNotReveal' in err) {
                errMsg = `You should not reveal this secret yet!`
              } else if ('tooLate' in err) {
                errMsg = `You uploaded the key-shares too late. Maximum is 3 days. You receive no payout!`
              } else if ('secretExpired' in err) {
                errMsg = `This secret is already expired. No need to upload shares!`
              } else {
                errMsg = `Something went wrong!`
              }
            printToConsole(`Reveal secret ${secret.secret_id} FAILED: ${errMsg}`)
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
    }


    React.useEffect(async () => {
    }, [])

    return (
    <div className="content">
        <h1>Hands-Off Mode</h1>
        <a id="stop_button" data-text="Stop" onClick={stop => routeToPage('Staker', auth.getProps())} className="rainbow-button" style={{width: 100}}></a>
        <div className="hacker-console panel">
            <p id='hands_off_console' align='left' className="console-text"></p>
        </div>
    </div>
    )
}
