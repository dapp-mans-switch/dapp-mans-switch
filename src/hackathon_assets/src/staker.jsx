import * as React from 'react'
import { hackathon } from '../../declarations/hackathon'
import routToPage from './router'
import { generateKeyPair } from './crypto'
import { getPositiveNumber } from './helpers'


export default function Staker() {

  const [amount, setAmount] = React.useState('')
  const [duration, setDuration] = React.useState('')

  async function addStaker() {
    let amountInt
    let durationInt
    try {
      amountInt = getPositiveNumber(amount)
      durationInt = getPositiveNumber(duration)
    } catch (error) {
      console.log(error)
      alert('Amount and duration must be positive numbers!')
      return
    }
    const keyPair = generateKeyPair()
    console.log(keyPair.privateKey)

    document.getElementById('staker_form').reset()
    // TODO: replace 'Staker1' by identification Auth
    const newStakerId = await hackathon.registerStaker('Staker1', keyPair.publicKey, amountInt, durationInt)
    alert(`New staker created with id: ${newStakerId}, pls back up ur private key ;): ${keyPair.privateKey}`)
  }

  async function listAllStakers() {
    const stakes = await hackathon.listAllStakers()

    const table = document.getElementById('stakerTable')

    const col_names = ['name', 'amount', 'days']
    table.innerHTML = ''

    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    stakes.map(function (s) {
      const tr = table.insertRow(-1)
      for (const cn of col_names) {
        const tabCell = tr.insertCell(-1)
        tabCell.innerHTML = s[cn]
      }
    });
  }


  return (
    <div>
      <h1>Staker</h1>
      This is the Staker's page.

      <form id="staker_form">
        <label htmlFor="stakeAmount">Amount:</label>
        <input id="stakeAmount" type="number" onChange={(ev) => setAmount(ev.target.value)}/> <br/>
        <label htmlFor="stakeDuration">Duration (Days):</label>
        <input id="stakeDuration" type="number" onChange={(ev) => setDuration(ev.target.value)}/> <br/>
        {/* TODO: this option needs to be toggleable for each stake, so it has to be moved to the stake list */}
        <label htmlFor="no_new_stakes">Don't receive new shares</label>
        <input type="checkbox" id="no_new_stakes" name="no_new_stakes" value="Stakes"/>

        <a id="add_new_stake_button" data-text="Start Stake" onClick={addStaker} class="rainbow-button" style={{width: 300}}></a>
        <br/>
      </form>

      <h2>My Stakes</h2>
      <button onClick={listAllStakers}>List my Stakes</button>

      <table id="stakerTable" border={2} cellPadding={5}/>

      <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
    </div>
  );
};
