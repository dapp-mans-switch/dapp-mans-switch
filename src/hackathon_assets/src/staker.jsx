import * as React from 'react'
import { hackathon } from '../../declarations/hackathon'
import routToPage from './router'
import * as crypto from './crypto'
import * as helpers from './helpers'


export default function Staker() {

  const [amount, setAmount] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [stakerId, setStakerId] = React.useState('')
  const [stakerPrivateKey, setStakerPrivateKey] = React.useState('')

  async function revealSecretShare() {
    let stakerIdInt
    try {
      stakerIdInt = helpers.getNaturalNumber(stakerId)
    } catch (error) {
      console.log(error)
      alert('Invalid numbers entered')
      return
    }

    let staker = await hackathon.lookupStaker(stakerIdInt)
    staker = staker[0]

    let secrets = await hackathon.listAllSecrets()
    let relevantSecrets = helpers.getSecretsForStaker(staker['staker_id'], secrets)
    console.log(relevantSecrets)

    for (let i = 0; i < relevantSecrets.length; i++) {
      // TODO check if decryption of secret is allowed (time or heartbeat)
      // TODO check if secret already decrypted (e.g. look for '.' in secret ?)
      let done
      try {
        done = await helpers.decryptStakerSecretShare(stakerId, relevantSecrets[i], stakerPrivateKey)
        console.log(relevantSecrets[i]['secret_id'])
        console.log(done)
        alert('published share')

      } catch (error) {
        console.log(`failed decryption at index ${i}`)
        console.log(error)
      }
      
    }
  
  }

  async function addStaker() {
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
    const keyPair = crypto.generateKeyPair()
    console.log(keyPair.privateKey)

    document.getElementById('staker_form').reset()
    // TODO: replace 'Staker1' by identification Auth
    const newStakerId = await hackathon.registerStaker('Staker', keyPair.publicKey, amountInt, durationInt)
    downloadPrivateKey(keyPair.privateKey, newStakerId)
    alert(`New staker created with id: ${newStakerId}.\nThe private key was saved as a download. \nMake sure to store this file securely, since you will need it to decrypt your share.`)
    listAllStakers()
  }

  async function removeStaker(id) {
    console.log("geemmmma: " + id)
    const deleted = await hackathon.removeStaker(id)
    if (deleted == false) {
      alert("cannot delete staker with id: " + id)
    }
    listAllStakers()
  }

  // write private key to file and safe to downloads
  // staker_id is prepended to the file name
  function downloadPrivateKey(privateKey, staker_id) {
    if (privateKey == null) {
      alert("Please create your private key first")
    }
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(privateKey));
    element.setAttribute('download', staker_id + '_private_key');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  async function listAllStakers() {
    let stakes = await hackathon.listAllStakers()
    stakes.sort(function(a, b) { 
      return - (parseInt(b.staker_id) - parseInt(a.staker_id));
    });

    console.log(stakes)

    const table = document.getElementById('stakerTable')

    const col_names = ['staker_id', 'name', 'amount', 'days']
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
      for (const cn of col_names) {
        const tabCell = tr.insertCell(-1)
        tabCell.innerHTML = s[cn]
      }
      const deleteButtonCell = tr.insertCell(-1)
      const deleteButton = document.createElement('button')
      deleteButton.innerHTML = "delete"
      deleteButton.className = "deleteButton"
      deleteButton.addEventListener("click", () => { removeStaker(s['staker_id'])})
      deleteButtonCell.appendChild(deleteButton)
    });
  }

  React.useEffect(() => {
    listAllStakers()
  })

  return (
    <div>
      <h1>Staker</h1>
      This is the Staker's page.

      <div class="panel">
        <h2>Create new Stake</h2>
        <form id="staker_form">
          <label htmlFor="stakeAmount">Amount:</label>
          <span><input id="stakeAmount" type="number" onChange={(ev) => setAmount(ev.target.value)}/></span>
          <label htmlFor="stakeDuration">Duration (Days):</label>
          <span><input id="stakeDuration" type="number" onChange={(ev) => setDuration(ev.target.value)}/></span>
          {/* TODO: this option needs to be toggleable for each stake, so it has to be moved to the stake list */}
          <label htmlFor="no_new_stakes">Don't receive new shares</label>
          <span><input type="checkbox" id="no_new_stakes" name="no_new_stakes" value="Stakes"/></span>
        </form>
        <a id="add_new_stake_button" data-text="Start Stake" onClick={addStaker} class="rainbow-button" style={{width: 200}}></a>
      </div>

      <div class="panel">
        <h2>My Stakes</h2>
        <table id="stakerTable" cellPadding={5}/>
      </div>

      <div class="panel">
        <h2>Reveal a secret share</h2>
        <form>
          <label htmlFor="stakerId">Enter your staker ID:</label>
          <span><input id="stakerId" type="number" onChange={(ev) => setStakerId(ev.target.value)}/></span>
          <label htmlFor="stakerPrivateKey">Enter your private key:</label>
          <span><input id="stakerPrivateKey" type="text" onChange={(ev) => setStakerPrivateKey(ev.target.value)}/></span>
        </form>
        <a id="reveal_secret_share_button" data-text="Reveal Secret Share" onClick={revealSecretShare} class="rainbow-button" style={{width: 330}}></a>
      </div>

      <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
    </div>
  );

};

