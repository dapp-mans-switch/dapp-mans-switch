import * as React from 'react'
import { render } from 'react-dom'

import * as crypto from './crypto'
import * as helpers from './helpers'
import routToPage from './router'

import backButtonVideo from './../assets/back_button.mkv'
import {appendLoadingAnimation, removeLoadingAnimation} from './loadingAnimation'
import {errorPopup} from './errorPopup'
import Wallet from './wallet'


export default function Staker(props) {
  
  const auth = props.auth;
  const hackathon = props.canisters.hackathon;
  const token = props.canisters.token;
  
  const [amount, setAmount] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [revealSecretId, setRevealSecretId] = React.useState('')
  const [stakerPrivateKey, setStakerPrivateKey] = React.useState('')
  
  
  /**
  * Checks whether the current user is registered as a staker.
  */
  async function isRegistered() {
    return await hackathon.isRegistered()
  }
  
  
  /**
  * Registers a new staker.
  * Creats a public/private keypair that is used for en- and decrypting shares.
  * Sends the public key to the backend and downloads the private key.
  */
  async function registerStaker() {
    const keyPair = crypto.generateKeyPair()
    
    const result = await hackathon.registerStaker(keyPair.publicKey)
    
    if ('ok' in result) {
      let publicKey = result['ok']
      console.log("Staker registerd with public key", publicKey)
      console.log("PrivateKey:", keyPair.privateKey)
      
      downloadPrivateKey(keyPair.privateKey)
      //errorPopup(`The private key was saved as a download.\nMake sure to store this file securely, since you will need it to decrypt your key-shares to earn rewards.`, "register_staker_btn", true)
    }
    
    if ('err' in result) {
      const err = result['err']
      if ('alreadyRegistered' in err) {
        let principal = err['alreadyRegistered']
        errorPopup(`User with principal ${principal.toString()} is already a registered staker!`, "register_staker_btn")
      } else if ('invalidKey' in err) {
        // base64 is guaranteed by crypto.js
        errorPopup(`Generated public key ${err['invalidKey']} is not a valid key!`, "register_staker_btn")
      } else {
        errorPopup(`Something went wrong!`, "register_staker_btn")
      }
      console.error("RegisterStakerError:", err)
    }
    
    listAllStakes()
    renderRegisterXORStakerPanels()
  }
  
  
  /**
  * Get the encrypted shares for a given secret from the backend, decrypt and upload them.
  */
  async function revealSecretShare() {
    if (!(await isRegistered())) {
      alert("Please register first!")
      return
    }
    
    appendLoadingAnimation("reveal_secret_share_button", false)
    
    let addButton = document.getElementById("reveal_secret_share_button")
    addButton.classList.add("trigger-animation")
    
    document.getElementById("reveal-secret-from").reset()
    
    // TODO: Why was that here?
    // const backendPublicKey = await hackathon.lookupMyPublicKey()
    // console.log("PublicKey:", backendPublicKey[0])
    
    let secretId
    try {
      secretId = helpers.getNaturalNumber(revealSecretId)
    } catch (error) {
      console.log(error)
      errorPopup('Secret ID must be a positive number!', 'reveal_secret_share_button')
      removeLoadingAnimation()
      return
    }
    
    let relevantSecret = await hackathon.getRelevantSecret(secretId)
    //console.log('relevantSecret', relevantSecret)
    
    if (relevantSecret.len == 0) {
      errorPopup(`No secret for id ${secretId}!`, 'reveal_secret_share_button')
      removeLoadingAnimation()
      return
    }
    
    let secret = relevantSecret[0]
    
    console.log("Secret to reveal", secret)
    
    // check if secret already decrypted
    if (secret.hasRevealed) {
      errorPopup("You already have revealed your share of this secret!", 'reveal_secret_share_button', true)
      removeLoadingAnimation()
      return
    }
    
    // check if decryption of secret is allowed (time or heartbeat)
    if (!secret.shouldReveal) {
      errorPopup("You should not reveal your shares of this secret yet!", 'reveal_secret_share_button', true)
      removeLoadingAnimation()
      return
    }
    
    let decryptedShares = []
    try {
      const uploaderPublicKey = secret['uploader_public_key']
      
      console.log(stakerPrivateKey)
      
      for (let j = 0; j < secret.relevantShares.length; j++) {
        decryptedShares.push(crypto.decryptKeyShare(secret.relevantShares[j], stakerPrivateKey, uploaderPublicKey))
      }
      console.log("decryptedShares", decryptedShares)
    } catch (error) {
      console.log(`Failed decryption: ${error}`)
      errorPopup(`Failed decryption: ${error}`, 'reveal_secret_share_button')
      removeLoadingAnimation()
      return
    }
    
    let result = await hackathon.revealAllShares(secret.secret_id, decryptedShares);
    if ('ok' in result) {
      let payout = result['ok']['payout']
      console.log('updatedSecret', result['ok']['secret'])
      errorPopup(`Successfully revealed your shares for secret with id ${secret.secret_id} with payout ${payout}`, 'reveal_secret_share_button', true, false)
    } else if ('err' in result) {
      const err = result['err']
      if ('secretNotFound' in err) {
        errorPopup(`Secret with id ${err['secretNotFound']} was not found!`, 'reveal_secret_share_button')
      } else if ('invalidDecryptedSHA' in err) {
        errorPopup(`SHA of decrypted share did not match!`, 'reveal_secret_share_button')  // wrong shares, wrong order -> should not happen
      } else if ('wrongNumberOfShares' in err) {
        errorPopup(`Invalid number of shares uploaded!`, 'reveal_secret_share_button') // -> should not happen
      } else if ('alreadyRevealed' in err) {
        errorPopup(`You have already revealed this secret!`, 'reveal_secret_share_button')
      } else if ('insufficientFunds' in err) {
        errorPopup(`Insufficient funds: ${err['insufficientFunds']}`, 'reveal_secret_share_button')
      } else if ('shouldNotReveal' in err) {
        errorPopup(`You should not reveal this secret yet!`, 'reveal_secret_share_button')
      } else if ('tooLate' in err) {
        errorPopup(`You uploaded the key-shares too late. Maximum is 3 days. You receive no payout!`, 'reveal_secret_share_button', true)
      } else if ('secretExpired' in err) {
        errorPopup(`This secret is already expired. No need to upload shares!`, 'reveal_secret_share_button', true)
      } else {
        errorPopup(`Something went wrong!`, 'reveal_secret_share_button')
      }
      console.error(err)
    }
    
    listAllRelevantSecrets()
    addButton.classList.remove("trigger-animation")
    removeLoadingAnimation()
    window.getBalance()
  }
  
  
  /**
  * Creates a new stake.
  */
  async function addStake() {
    if (!(await isRegistered())) {
      alert("Please register first!")
      return
    }
    
    // disable stake button to prevent multi staking
    let startStakeButton = document.getElementById('add_new_stake_button')
    startStakeButton.style.pointerEvents = "none"
    
    appendLoadingAnimation("add_new_stake_button", false)
    console.log("addStake")
    
    let amountInt
    let durationInt
    try {
      amountInt = helpers.getPositiveNumber(amount)
      durationInt = helpers.getPositiveNumber(duration)
    } catch (error) {
      removeLoadingAnimation()
      errorPopup('Amount and duration must be positive numbers!', 'add_new_stake_button')
      console.log(error)
      // re-enable stake button
      startStakeButton.style.pointerEvents = "auto"
      return
    }
    
    let hackathonID = await hackathon.identity();
    await token.approve(hackathonID, amountInt, []); // should not throw error
    const result = await hackathon.addStake(amountInt, durationInt)
    
    removeLoadingAnimation()
    listAllStakes()
    
    if ('ok' in result) {
      let newStakeId = result['ok']
      errorPopup(`Stake with id ${newStakeId} was added!`, 'add_new_stake_button', true, false)
      // reset form after successful stake
      setAmount(null)
      setDuration(null)
      document.getElementById('staker_form').reset()
    } else if ('err' in result) {
      const err = result['err']
      if ('unknownStaker' in err) {
        errorPopup(`You (${err['unknownStaker'].toString()}) are not a registered staker!`, 'add_new_stake_button')
      } else if ('invalidDuration' in err) {
        errorPopup(`Could not add a stake with invalid duration ${err['invalidDuration']}`, 'add_new_stake_button')
      } else if ('transferError' in err) {
        errorPopup(`Failed token transfer: ${err['transferError']}`, 'add_new_stake_button')
      } else {
        errorPopup(`Something went wrong!`, 'add_new_stake_button')
      }
      console.error(result['err'])
    }
    
    // re-enable stake button
    startStakeButton.style.pointerEvents = "auto"
    
    // this.walletRef.current.getBalance()
    window.getBalance()
  }
  
  
  /**
  * Ends a given stake.
  * More info in the relevant backend function.
  */
  async function endStake(stake) {
    let now = new Date() / 1000;
    if (stake['expiry_time'] > now) {
      let ok = confirm("This stake is not expired yet. If you end the stake now, you will not get back all your tokens! Continue?");
      if (!ok) {
        return
      }
    }
    appendLoadingAnimation("stakerTable", true)
    let stake_id = stake['stake_id']
    const result = await hackathon.endStake(stake_id)
    
    removeLoadingAnimation()
    listAllStakes()
    
    if ('ok' in result) {
      errorPopup(`End stake with payout ${result['ok']['payout']}`, 'stakerTable', true, false)
    }
    if ('err' in result) {
      const err = result['err']
      if ('stakeNotFound' in err) {
        let stake_id = err['stakeNotFound']
        errorPopup(`Stake with id ${stake_id} was not found!`, 'stakerTable')
      } else if ('permissionDenied' in err) {
        // should not happen as staker only sees his stakes.
        errorPopup(`You don't have permission to end this stake.`, 'stakerTable')
      } else if ('alreadyPayedOut' in err) {
        errorPopup(`Stake was already ended and payed out!`, 'stakerTable')
      } else if ('insufficientFunds' in err) {
        errorPopup(`Insufficient funds: ${err['insufficientFunds']}`, 'stakerTable')
      } else {
        errorPopup(`Something went wrong!`, 'stakerTable')
      }
      console.error(err)
    }
    
    window.getBalance()
  }
  
  
  /*
  * Writes private key to a file and downloads it.
  */
  function downloadPrivateKey(privateKey) {
    if (privateKey == null) {
      alert("Please create your private key first")
    }
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(privateKey));
    element.setAttribute('download', 'staker-private-key.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  
  
  /**
  * Populates the 'My Stakes' table.
  */
  async function listAllStakes() {
    let stakes = await hackathon.listMyStakes()
    stakes.sort(function(a, b) {
      return - (parseInt(b.expiry_time) - parseInt(a.expiry_time));
    });
    
    const table = document.getElementById('stakerTable')
    
    const col_names = ['Amount', 'Expires on']
    table.innerHTML = ''
    
    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    // const deleteCell = tr.insertCell(-1)
    // deleteCell.innerHTML = "delete"

    let now = new Date() / 1000
    
    stakes.map(function (s) {
      const tr = table.insertRow(-1)
      const amountCell =  tr.insertCell(-1)
      amountCell.innerHTML = s['amount']
      
      const dateCell = tr.insertCell(-1)
      
      let expiryDate = helpers.secondsSinceEpocheToDate(s['expiry_time'])
      dateCell.innerHTML = expiryDate
      
      if (s.valid) {
        const deleteButtonCell = tr.insertCell(-1)
        const deleteButton = document.createElement('button')
        deleteButton.innerHTML = "End stake"
        deleteButton.className = "endStakeButton"
        deleteButton.addEventListener("click", () => { endStake(s)})

        if (s.expiry_time < now) {
          deleteButton.style.borderColor = "rgb(0, 209, 80)";
        }

        deleteButtonCell.appendChild(deleteButton)

      } else {
        //deleteButton.disabled = true;
        amountCell.style.color = '#1010104d';
        dateCell.style.color = '#1010104d';
      }
      
    });
  }
  
  const interval = setInterval(listAllRelevantSecrets, 60*1000)
  
  /**
  * Populates the 'My Secret Shares' table.
  */
  async function listAllRelevantSecrets() {
    console.log("listAllRelevantSecrets")
    let relevantSecrets = await hackathon.listRelevantSecrets()
    relevantSecrets.sort(function(a, b) {
      return - (parseInt(b.secret_id) - parseInt(a.secret_id));
    });
    
    //console.log(relevantSecrets)
    
    const table = document.getElementById('secretsTable')
    
    const col_names = ['Secret ID', 'Shares', 'Status', 'Expires on', '']
    table.innerHTML = ''
    
    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    
    relevantSecrets.map(function (s) {
      const tr = table.insertRow(-1)
      
      const idCell = tr.insertCell(-1)
      idCell.innerHTML = s.secret_id
      
      const sharesCell = tr.insertCell(-1)
      sharesCell.innerHTML = s.relevantShares.length
      
      const hasCell = tr.insertCell(-1)
      hasCell.innerHTML = s.hasPayedout
      if (s.hasPayedout) {
        hasCell.innerHTML = "&#9989"
      } else {
        hasCell.innerHTML = "&#10060"
      }
      
      const expiresOnCell = tr.insertCell(-1)
      expiresOnCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time)
      
      
      const buttonCell = tr.insertCell(-1)
      
      
      // shouldCell.innerHTML = s.shouldReveal
      if (s.shouldReveal) {
        // enable reveal button only of should reveal is true
        const secretIdText = document.getElementById('revealSecretId')
        let button = document.createElement('button')
        buttonCell.appendChild(button)
        button.innerHTML = "Reveal"
        button.className = "revealButton"
        button.addEventListener("click", function() {
          setRevealSecretId(s.secret_id)
          secretIdText.value = s.secret_id
          document.getElementById("reveal-secret-from").scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"})
        })
        
        if (s.hasPayedout) {
          // already revealed
          button.disabled = true
          hasCell.innerHTML = "&#9989"
        } else {
          hasCell.innerHTML = "&#10071"
        }
        
      } else {
        if (s.hasPayedout) {
          hasCell.innerHTML = "&#9989"
          
        } else {
          
          if (s.expiry_time < new Date() / 1000) {
            // expired secret, can request payout
            let button = document.createElement('button')
            buttonCell.appendChild(button)
            button.innerHTML = "Payout"
            button.className = "revealButton"
            button.addEventListener("click", function() {
              requestPayout(s.secret_id)
            })
            
            hasCell.innerHTML = "&#10071"
            
          } else {
            // secret author still alive
            hasCell.innerHTML = "&#128147"
          }
        }
      }
    });
  }
  
  
  async function requestPayout(secretId) {
    appendLoadingAnimation("secretsTable", true)
    const result = await hackathon.requestPayout(secretId)
    removeLoadingAnimation()
    listAllRelevantSecrets()
    window.getBalance()
    console.log("requestPayout", result)
    if ('ok' in result) {
      const payout = result['ok']
      errorPopup(`You received a payout of ${payout} tokens!`, 'secretsTable_status_legend', true, false)
    }
    if ('err' in result) {
      const err = result['err']
      if ('alreadyPayedOut' in err) {
        errorPopup(`The reward for these key-shares was already payed out!`, 'secretsTable_status_legend')
      } else if ('shouldReveal' in err) {
        errorPopup(`You should reveal the shares of this secret, not request payout!`, 'secretsTable_status_legend')
      } else if ('insufficientFunds' in err) {
        errorPopup(`Insufficient funds: ${err['insufficientFunds']}`, 'secretsTable_status_legend')
      } else [
        errorPopup(`Something went wrong!`, 'secretsTable_status_legend')
      ]
    }
  }
  
  /**
  * Renders the wallet.
  */
  async function createWallet() {
    render(React.createElement(Wallet, props), document.getElementById('my-wallet'))
    // render(React.createElement(Wallet, {...props, ref: {walletRef}}), document.getElementById('my-wallet'))
  }
  
  /**
  * Decides what view is to be rendered based on registration status.
  */
  async function renderRegisterXORStakerPanels() {
    const reg = await isRegistered()
    const signedUp = document.getElementById("signedUp")
    const register = document.getElementById("register")
    if (reg) {
      signedUp.hidden = false
      register.hidden = true
    } else {
      signedUp.hidden = true
      register.hidden = false
    }
  }
  
  window.onpopstate = goBack
  history.pushState({}, '')
  
  React.useEffect(() => {
    window.scrollTo(0,0);
    listAllStakes()
    listAllRelevantSecrets()
    createWallet()
    renderRegisterXORStakerPanels()
  }, []);
  
  function goBack() {
    console.log("End interval", interval)
    clearInterval(interval)
    routToPage('Main')
  }

  function handsOff() {
    clearInterval(interval)
    // for demo mode: oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==
    let privateKey = prompt('Enter private key to start hands-off mode!', '')
    props = auth.getProps()
    props.privateKey = privateKey
    routToPage('HandsOff', props)
  }
  
  return (
    <div className="eventHorizon">
    <div className="header-n-nav">
    <a onClick={goBack}>
    <video autoPlay loop muted className="back-button-video">
    <source src={backButtonVideo}/>
    </video>
    </a>
    <h1>Staker</h1>
    </div>
    
    <div className="description-and-wallet">
    <div className="description">
    <p>Stake $HRBT to receive key-shares.</p>
    <p>When you decrypt a key-share at the right time, you will be richly rewarded.</p>
    </div>
    <div id="my-wallet"/>
    </div>
    
    <div id="register" className="panel" hidden={true}>
    <a id="register_staker_btn" data-text="Register as Staker" onClick={() => registerStaker()} className="rainbow-button" style={{width: 330}}></a>
    </div>
    
    <div id="signedUp" hidden={true}>
    <a id="hands_off_button" data-text="Hands-off mode" onClick={handsOff} className="rainbow-button" style={{width: 400}}></a>

    <div className="panel">
    <h3>Create New Stake</h3>
    <form id="staker_form">
    <label htmlFor="stakeAmount">Amount:</label>
    <span><input id="stakeAmount" type="number" autoComplete='off' onChange={(ev) => setAmount(ev.target.value)}/></span>
    <label htmlFor="stakeDuration">Duration (days):</label>
    <span><input id="stakeDuration" type="number" autoComplete='off' onChange={(ev) => setDuration(ev.target.value)}/></span>
    </form>
    <a id="add_new_stake_button" data-text="Start stake" onClick={addStake} className="rainbow-button" style={{width: 200}}></a>
    </div>
    
    <div className="panel">
    <h3>My Stakes</h3>
    <table id="stakerTable" cellPadding={5}/>
    </div>
    
    <div className="panel">
    <h3>My Key-Shares</h3>
    <table id="secretsTable" cellPadding={5}/>
    <p id="secretsTable_status_legend">&#9989; ... done, &#10071; ... action possible, &#128147; ... secret author alive. </p>
    </div>
    
    <div className="panel">
    <h3>Reveal a Key-Share</h3>
    <form id="reveal-secret-from">
    <label htmlFor="stakerId">Secret ID:</label>
    <span><input id="revealSecretId" type="number" autoComplete='off' onChange={(ev) => setRevealSecretId(ev.target.value)}/></span>
    
    <label htmlFor="stakerPrivateKey">Your private key:</label>
    <span><input id="stakerPrivateKey" type="text" autoComplete='off' onChange={(ev) => setStakerPrivateKey(ev.target.value)}/></span>
    </form>
    <a id="reveal_secret_share_button" data-text="Reveal Key Share" onClick={revealSecretShare} className="rainbow-button" style={{width: 330}}></a>
    </div>
    </div>
    
    <a onClick={goBack}>
    <video autoPlay loop muted className="back-button-big">
    <source src={backButtonVideo}/>
    </video>
    </a>
    </div>
    );
  }
  