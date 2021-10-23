import * as React from 'react'
//import { hackathon } from '../../declarations/hackathon'
import routToPage from './router'
import * as crypto from './crypto'
import * as helpers from './helpers'
import { copyFileSync } from 'fs';


export default function Staker(props) {

  const hackathon = props.actor;
  const identity = props.identity;

  const [amount, setAmount] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [stakerId, setStakerId] = React.useState('')
  const [revealSecretId, setRevealSecretId] = React.useState('')
  const [stakerPrivateKey, setStakerPrivateKey] = React.useState('')

  async function isRegistered() {
    const backendPublicKey = await hackathon.lookupPublicKey(identity.getPrincipal())
    return backendPublicKey.length > 0
  }

  async function registerStaker() {
    const keyPair = crypto.generateKeyPair()

    const result = await hackathon.registerStaker(keyPair.publicKey)
    
    if (result['ok']) {
      let publicKey = result['ok']
      console.log("Staker registerd with public key", publicKey)
      console.log("PrivateKey:", keyPair.privateKey)

      downloadPrivateKey(keyPair.privateKey)
      alert(`The private key was saved as a download. \nMake sure to store this file securely, since you will need it to decrypt your share.`)
    }
    if (result['err']) {
      if (result['err']['alreadyRegistered']) {
        let principal = result['err']['alreadyRegistered']
        console.error("Staker already registered!", principal)
      } else {
        // base64 is guaranteed
        console.error(result['err'])
      }
    }

    listAllStakes()
  }

  async function revealSecretShare() {
    if (!(await isRegistered())) {
      alert("Please register first!")
      return
    }
    
    let addButton = document.getElementById("reveal_secret_share_button")
    addButton.classList.add("trigger-animation")

    document.getElementById("reveal-secret-from").reset()

    const backendPublicKey = await hackathon.lookupPublicKey(identity.getPrincipal())
    console.log("PublicKey:", backendPublicKey[0])
    
    let secretId
    try {
      secretId = helpers.getNaturalNumber(revealSecretId)
    } catch (error) {
      console.log(error)
      alert('Invalid numbers entered')
      return
    }

    let relevantSecret = await hackathon.getRelevantSecret(identity.getPrincipal(), secretId)
    //console.log('relevantSecret', relevantSecret)

    if (relevantSecret.len == 0) {
      console.log("no secret for secret_id")
      return
    }
    let secret = relevantSecret[0]

    console.log("Secret to reveal", secret)

    // check if decryption of secret is allowed (time or heartbeat)
    // check if secret already decrypted
    if (secret.hasRevealed || !secret.shouldReveal) {
      console.log("Do not reveal")
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
      console.log(`failed decryption`)
      console.log(error)
      return
    }

    
    let updatedSecret = await hackathon.revealAllShares(secret.secret_id, decryptedShares);
    if (updatedSecret.length > 0) {
      listAllRelevantSecrets()
      console.log('updatedSecret', updatedSecret[0])
      alert('published share')
    }

    addButton.classList.remove("trigger-animation")
  }

  async function addStake() {
    if (!(await isRegistered())) {
      alert("Please register first!")
      return
    }

    console.log("addStake")
    let addButton = document.getElementById("add_new_stake_button")
    addButton.classList.add("trigger-animation")

    let amountInt
    let durationInt
    try {
      amountInt = helpers.getPositiveNumber(amount)
      durationInt = helpers.getPositiveNumber(duration)
    } catch (error) {
      console.log(error)
      alert('Amount and duration must be positive numbers!')
      return
    }

    document.getElementById('staker_form').reset()
    
    const newStakeId = await hackathon.addStake(amountInt, durationInt)
    console.log("Stake id:", newStakeId)
    listAllStakes()

    addButton.classList.remove("trigger-animation")
  }

  async function removeStaker(id) {
    const deleted = await hackathon.removeStake(id)
    if (deleted == false) {
      alert("cannot delete staker with id: " + id)
    }
    listAllStakes()
  }

  // write private key to file and safe to downloads
  // staker_id is prepended to the file name
  function downloadPrivateKey(privateKey) {
    if (privateKey == null) {
      alert("Please create your private key first")
    }
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(privateKey));
    element.setAttribute('download', 'private_key');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  async function listAllStakes() {
    let stakes = await hackathon.listStakesOf(identity.getPrincipal())
    stakes.sort(function(a, b) { 
      return - (parseInt(b.staker_id) - parseInt(a.staker_id));
    });

    //console.log(stakes)

    const table = document.getElementById('stakerTable')

    const col_names = ['amount', 'expiry_time']
    table.innerHTML = ''

    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    // const deleteCell = tr.insertCell(-1)
    // deleteCell.innerHTML = "delete"


    stakes.map(function (s) {
      const tr = table.insertRow(-1)
      const amountCell =  tr.insertCell(-1)
      amountCell.innerHTML = s['amount']

      const dateCell = tr.insertCell(-1)
      dateCell.innerHTML = helpers.secondsSinceEpocheToDate(s['expiry_time']).toLocaleString()

      const deleteButtonCell = tr.insertCell(-1)
      const deleteButton = document.createElement('button')
      deleteButton.innerHTML = "delete"
      deleteButton.className = "deleteButton"
      deleteButton.addEventListener("click", () => { removeStaker(s['stake_id'])})
      deleteButtonCell.appendChild(deleteButton)
    });
  }

  async function listAllRelevantSecrets() {

    let relevantSecrets = await hackathon.listRelevantSecrets(identity.getPrincipal())
    relevantSecrets.sort(function(a, b) { 
      return - (parseInt(b.secret_id) - parseInt(a.secret_id));
    });

    //console.log(relevantSecrets)

    const table = document.getElementById('secretsTable')

    const col_names = ['secret_id', 'n_shares', 'shouldReveal', 'hasRevealed']
    table.innerHTML = ''

    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    relevantSecrets.map(function (s) {
      const tr = table.insertRow(-1)

      const idCell = tr.insertCell(-1)
      
      const secretIdText = document.getElementById('revealSecretId')
      // TODO: make visibile that cell is clickable
      idCell.addEventListener("click", function() {
        console.log(s.secret_id)
        setRevealSecretId(s.secret_id)
        secretIdText.value = s.secret_id
      })
      idCell.innerHTML = s.secret_id

      const sharesCell = tr.insertCell(-1)
      sharesCell.innerHTML = s.relevantShares.length

      const shouldCell = tr.insertCell(-1)
      shouldCell.innerHTML = s.shouldReveal

      const hasCell = tr.insertCell(-1)
      hasCell.innerHTML = s.hasRevealed
    });
  }

  React.useEffect(() => {
    listAllStakes()
    listAllRelevantSecrets()
  })

  function debug() {
    setStakerId(1)
    listAllStakes()
    listAllRelevantSecrets()
  }

  return (
    <div>
      <h1>Staker</h1>
      This is the Staker's page.

      
      <div id="register" class="panel">
        <button onClick={() => registerStaker()}>Register Staker</button>
      </div>

      <div class="panel">
        <h2>Create new Stake</h2>
        <form id="staker_form">
          <label htmlFor="stakeAmount">Amount:</label>
          <span><input id="stakeAmount" type="number" onChange={(ev) => setAmount(ev.target.value)}/></span>
          <label htmlFor="stakeDuration">Duration (Days):</label>
          <span><input id="stakeDuration" type="number" onChange={(ev) => setDuration(ev.target.value)}/></span>
        </form>
        <a id="add_new_stake_button" data-text="Start Stake" onClick={addStake} class="rainbow-button" style={{width: 200}}></a>
      </div>

      <div class="panel">
        <h2>My Stakes</h2>
        <table id="stakerTable" cellPadding={5}/>
      </div>

      <div class="panel">
        <h2>My Secret Shares</h2>
        <table id="secretsTable" cellPadding={5}/>
      </div>

      <div class="panel">
        <h2>Reveal a secret share</h2>
        <form id="reveal-secret-from">
          <label htmlFor="stakerId">Enter secret ID:</label>
          <span><input id="revealSecretId" type="number" onChange={(ev) => setRevealSecretId(ev.target.value)}/></span>

          <label htmlFor="stakerPrivateKey">Enter your private key:</label>
          <span><input id="stakerPrivateKey" type="text" onChange={(ev) => setStakerPrivateKey(ev.target.value)}/></span>
        </form>
        <a id="reveal_secret_share_button" data-text="Reveal Secret Share" onClick={revealSecretShare} class="rainbow-button" style={{width: 330}}></a>
      </div>

      <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
      <button onClick={() => { debug() }}>DEBUG</button>
    </div>
  );

};

