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
        let spinner = document.getElementById("loadAnimation")
        spinner.classList.add("wallet-loading-animation")
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
                <p style={{marginTop: 0}}>Wallet Balance:</p>
                <b id="walletBalance">0 $HRBT</b>
            </div>
            <div>
                <button id="topUpButton" className="topup-button" onClick={buyTokens}><b style={{fontSize:1.2+'rem'}}>Top Up</b><br/>+100 $HRBT</button>
            </div>
        </div>
    );
}