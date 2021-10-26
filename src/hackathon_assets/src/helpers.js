import { floor } from 'mathjs'

export function getPublicKeysOfStakes(stakes) {
    let pubKeys = []
    for (let i = 0; i < stakes.length; i++) {
        pubKeys.push(stakes[i]['public_key'])
    }
    return pubKeys
}

export function getIdsOfStakes(stakes) {
    let ids = []
    for (let i = 0; i < stakes.length; i++) {
        ids.push(stakes[i]['stake_id'])
    }
    return ids
}

export function getPositiveNumber(string) {
    let num = parseInt(string)
    if (isNaN(num) || num <= 0) {
        throw 'Please enter a positive number'
    } 
    return num
}

export function getNaturalNumber(string) {
    let num = parseInt(string)
    if (isNaN(num) || num < 0) {
        throw 'Please enter a positive number'
    } 
    return num
}

export function secondsSinceEpocheToDate(string) {
    const d = new Date(parseInt(string) * 1000)
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return d.toLocaleString('en-US', options)
}

export function secondsSinceEpoch() {
    return floor((new Date()) / 1000) // milliseconds to seconds
}
