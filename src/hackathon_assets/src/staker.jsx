import * as React from "react";
import { hackathon } from "../../declarations/hackathon";
import routToPage from './router';
import { generateKeyPair } from "./crypto";


export default function Staker() {

  const [amount, setAmount] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [myStakes, setMyStakes] = React.useState('');


  async function addStaker() {
    let a = parseInt(amount);
    let d = parseInt(duration);
    const keyPair = generateKeyPair()
    console.log(keyPair.privateKey)

    if (isNaN(a) || isNaN(d) || a <= 0 || d <= 0) {
      alert("amount and duration must be positive integer");
    } else {
      document.getElementById("staker_form").reset();
      // TODO: replace "Staker1" by identification Auth
      const newStakerId = await hackathon.registerStaker("Staker1", keyPair.publicKey, a, d);
      alert(`new staker created with id: ${newStakerId}\nyour private key is: ${keyPair.privateKey}`);
    }
  }


  async function listAllStakers() {
    let stakes = await hackathon.listAllStakers();

    var table = document.getElementById("stakerTable");

    let col_names = ["name", "amount", "days"];
    table.innerHTML = "";

    var tr = table.insertRow(-1);
    for (const cn of col_names) {
      var tabCell = tr.insertCell(-1);
      tabCell.innerHTML = cn
    }

    stakes.map(function (s) {
      var tr = table.insertRow(-1);
      for (const cn of col_names) {
        var tabCell = tr.insertCell(-1);
        tabCell.innerHTML = s[cn];
      }
    });
  }


  return (
    <div>
      <h1>Staker</h1>
      This is the Staker's page.

      <form id="staker_form">
        <label htmlFor="stakeAmount">Amount:</label>
        <input id="stakeAmount" type="text" onChange={(ev) => setAmount(ev.target.value)}/> <br/>
        <label htmlFor="stakeDuration">Duration (Days):</label>
        <input id="stakeDuration" type="text" onChange={(ev) => setDuration(ev.target.value)}/> <br/>
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
