import { hackathon } from '../../declarations/hackathon'
import { NUMBER_OF_SHARES } from './crypto'
import { min } from 'mathjs'

export async function drawStakers() {
    const stakers = await hackathon.listAllStakers()
    let numShares = min(stakers.length, NUMBER_OF_SHARES)
   
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

export function getPositiveNumber(string) {
    let num = parseInt(string)
    if (isNaN(num) || num <= 0) {
        throw 'could not extract positive number'
    } 
    return num
}
