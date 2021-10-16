import * as React from "react";
import { render } from "react-dom";
import { hackathon } from "../../declarations/hackathon";
import routToPage from './router';


export default function Staker() {

  const [amount, setAmount] = React.useState('');
  const [duration, setDuration] = React.useState('');  
  const [myStakes, setMyStakes] = React.useState(''); 


  async function addStaker() {
    console.log("Staker request sent");
    // TODO: replace "Staker1" by identification Auth
    let a = parseInt(amount);
    let d = parseInt(duration);
    let public_key = 1234; // TODO
    if (isNaN(a) || isNaN(d) || a < 0 || a < 0) {
      alert("amount and duration must be positive integer");
    } else {
      const newStakerId = await hackathon.registerStaker("Staker1", public_key, a, d);
      alert(newStakerId);
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
