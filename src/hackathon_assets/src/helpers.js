import { hackathon } from '../../declarations/hackathon'
import * as crypto from './crypto'
import { min } from 'mathjs'

export async function drawStakes() {
    const stakes = await hackathon.listAllStakes()
    if (stakes.length == 0) {
        console.error('no stakes :(')
    }

    //let numShares = min(stakes.length, crypto.NUMBER_OF_SHARES)
    let numShares = crypto.NUMBER_OF_SHARES; // multiple shares for same stake
    console.log("Draw", numShares, "stakes")
   
    // TODO draw them with probability proportional to their stake
    // this should also happen in the backend on chain
    let chosenStakes = []
    for (let i = 0; i < numShares; i++) {
        chosenStakes.push(stakes[i % stakes.length])
    }
    return chosenStakes
}

export function getPublicKeysOfStakes(stakes) {
    let pubKeys = []
    for (let i = 0; i < stakes.length; i++) {
        pubKeys.push(stakes[i]['public_key'])
    }
    return pubKeys
}

/*
export function getPrincipalsOfStakes(stakes) {
    let principals = []
    for (let i = 0; i < stakes.length; i++) {
        principals.push(stakes[i]['staker_id'])
    }
    return principals
}*/

export function getIdsOfStakes(stakes) {
    let ids = []
    for (let i = 0; i < stakes.length; i++) {
        ids.push(stakes[i]['stake_id'])
    }
    return ids
}

/*
export function getSecretsForStaker(stakerId, secrets) {
    let relevantSecrets = []
    for (let i = 0; i < secrets.length; i++) {
        let shareHolders = secrets[i]['share_holder_ids']
        for (let j = 0; j < shareHolders.length; j++) {
            if (shareHolders[j] == stakerId) {
                relevantSecrets.push(secrets[i])
            }
        }
    }
    return relevantSecrets
}

export async function decryptStakerSecretShare(stakerId, secret, stakerPrivateKey) {
    const uploaderPublicKey = secret['uploader_public_key']
    const holders = secret['share_holder_ids']
    const shares = secret['shares']
    let index
    for (let i = 0; i < holders.length; i++) {
        if (holders[i] == stakerId) {
            index = i
            break
        }
    }
    const decryptedShare = crypto.decryptKeyShare(shares[index], stakerPrivateKey, uploaderPublicKey)
    const ready = await hackathon.revealKey(secret['secret_id'], decryptedShare, index)

    return ready
}
*/

export function getPositiveNumber(string) {
    let num = parseInt(string)
    if (isNaN(num) || num <= 0) {
        throw 'could not extract positive number'
    } 
    return num
}

export function getNaturalNumber(string) {
    let num = parseInt(string)
    if (isNaN(num) || num < 0) {
        throw 'could not extract positive number'
    } 
    return num
}

export function secondsSinceEpocheToDate(string) {
    let d = new Date(parseInt(string) * 1000) // seconds to milliseconds
    return d
}