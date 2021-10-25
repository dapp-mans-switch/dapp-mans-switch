import React from 'react'
import {appendLoadingAnimation, removeLoadingAnimation} from './loadingAnimation'


export default function Wallet(props) {

    const hackathon = props.canisters.hackathon;
    const token = props.canisters.token;

    // get current balance
    async function getBalance() {
        let balance = await token.myBalance()
        document.getElementById('walletBalance').innerHTML = balance + " $HRBT"
    }

    // top up balance (+100 $HRBT)
    async function buyTokens() {
        appendLoadingAnimation("topUpButton", false)
        await token.buyIn(100)
        getBalance()
        removeLoadingAnimation()
    }

    // make getBalance a global window-function
    window.getBalance = function() {
        getBalance()
    }

    React.useEffect(() => {
        getBalance()
    }, []);


    return(
        <div class="wallet-in-app">
            <div>
                <p>Balance:</p>
                <b id="walletBalance">0 $HRBT</b>
            </div>
            <div>
                <button id="topUpButton" onClick={buyTokens}>Top Up + 100 $HRBT</button>
            </div>
        </div>
    );
}