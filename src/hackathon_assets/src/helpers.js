import { hackathon } from '../../declarations/hackathon'
import * as crypto from './crypto'
import { min } from 'mathjs'

export async function drawStakers() {
    const stakers = await hackathon.listAllStakers()
    let numShares = min(stakers.length, crypto.NUMBER_OF_SHARES)
   
    // TODO draw them with probability proportional to their stake
    // this should also happen in the backend on chain
    let chosenStakers = []
    for (let i = 0; i < numShares; i++) {
        chosenStakers.push(stakers[i])
    }
    return chosenStakers
}

export function getPublicKeysOfStakers(stakers) {
    let pubKeys = []
    for (let i = 0; i < stakers.length; i++) {
        pubKeys.push(stakers[i]['public_key'])
    }
    return pubKeys
}

export function getPrincipalsOfStakers(stakers) {
    let principals = []
    for (let i = 0; i < stakers.length; i++) {
        principals.push(stakers[i]['id'])
    }
    return principals
}

export function getIdsOfStakers(stakers) {
    let ids = []
    for (let i = 0; i < stakers.length; i++) {
        ids.push(stakers[i]['staker_id'])
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