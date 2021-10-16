import * as React from "react";
import routToPage from './router';

export default function Uploader() {
    const PRIME = 115232748277998069089258273806792254226421333260171207744191778681748141500493
    
    
    function generateKeyPair() {
        //var SHA256 = require("crypto-js/sha256");
        let elliptic = require('elliptic');
        let ec = new elliptic.ec('secp256k1');
        let keyPair = ec.genKeyPair();
        
        return keyPair
    }
    
    
    function computeShares(private_key) {
        const { split, join } = require('shamir');
        // crypto module
        const CryptoJS = require("crypto-js");
        //const a = require("crypto")
        const { createHmac } = await import('crypto');

        console.log(CryptoJS.lib.WordArray.random(128))

        // the total number of shares
        const PARTS = 5;
        // the minimum required to recover
        const QUORUM = 3;
        // you can use any polyfill to covert between string and Uint8Array
        const utf8Encoder = new TextEncoder();
        const utf8Decoder = new TextDecoder();
        
        const secret = 'hello there';
        const secretBytes = utf8Encoder.encode(secret);
        // parts is a object whos keys are the part number and 
        // values are shares of type Uint8Array
        const parts = split(CryptoJS.lib.WordArray.random, PARTS, QUORUM, secretBytes);
        // we only need QUORUM parts to recover the secret
        // to prove this we will delete two parts
        delete parts[2];
        delete parts[3];
        // we can join three parts to recover the original Unit8Array
        const recovered = join(parts);
        // prints 'hello there'
        console.log(utf8Decoder.decode(recovered));
    }
    
    async function test() {
        let keyPair = generateKeyPair()
        console.log(keyPair.getPrivate().toString());
        console.log(keyPair.getPublic("hex"));
        
        computeShares(keyPair.getPrivate().toString())
    }
    
    return (
        <div>
            <h1>Uploader</h1>
            <p>This is the Uploader's page.</p>
            <a id="add_new_stake_button" data-text="Start Stake" onClick={test} class="rainbow-button" style={{width: 300}}></a>
            <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
        </div>
        )
    };