import * as React from "react";
import { render } from "react-dom";
import { hackathon } from "../../declarations/hackathon";


const Main = () => {

  // provisorial Router
  async function routToPage(pageName) {
    switch(pageName) {
      case "Staker":
        render(<Staker />, document.getElementById("app"));
        break;
      case "Uploader":
        render(<Uploader />, document.getElementById("app"));
        break;
      default:
    }
    
  }
  
  return (
    <div>
      <h1>Dead Man’s Switch</h1>
      <h3>using Proof of Stake</h3>
      
      regularly verify that you are alive, otherwise your uploaded files will get published

      <a id="staker_button" data-text="Staker" onClick={() => routToPage("Staker")} class="rainbow-button" style={{width: 150}}></a>
      <a id="uploader_button" data-text="Uploader" class="rainbow-button" style={{width: 180}}></a>

    </div>
  );
};

const Staker = () => {

  const [amount, setAmount] = React.useState('');
  const [duration, setDuration] = React.useState('');  
  const [myStakes, setMyStakes] = React.useState(''); 

  // route to Main page - Home
  async function goHome() {
    render(<Main />, document.getElementById("app"));
  }

  async function doGreet() {
    const greeting = await hackathon.greet(name);
    setMessage(greeting);
  }

  async function addStaker() {
    console.log("Staker request sent");
    // TODO: replace "Staker1" by identification Auth
    let a = parseInt(amount);
    let d = parseInt(duration);
    if (isNaN(a) || isNaN(d) || a < 0 || a < 0) {
      alert("amount and duration must be positive integer");
    } else {
      const newStakerId = await hackathon.addStaker("Staker1", a, d);
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
      
      <button onClick={goHome}>Go home, you're drunk.</button>
    </div>
  );
};

render(<Main />, document.getElementById("app"));