import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'

import Auth from './auth/auth'


export default function Main() {

  let hackathon
  let auth

  async function authenticate(debug=false) {
    document.body.style.backgroundColor = "red"; 
    // if you see this then getCanister is too slow and
    // we should deactivate buttons until the asynchronous function is done

    auth = new Auth()
    if (debug) {
      hackathon = auth.getAnomymousCanister()
    } else {
      let ok = await auth.auth()
      if (ok) {
        hackathon = await auth.getCanister()
      }
    }
    document.body.style.backgroundColor = "#E0E5EC";
  }
  
  authenticate()
  // authenticate(false) // for no auth and anonymous identity


  async function whoami() {
    let id = await hackathon.whoami()
    let s = id.toString()
    console.log("principal", id)

    if (s == '2vxsx-fae') {
      s += " (anonymous)"
    }

    alert("You are " + s);
  }

  return (
    <div>
    
      <h1>Dead Man’s Switch</h1>
      <h3>using Proof of Stake</h3>

      regularly verify that you are alive, otherwise your uploaded files will get published

      <div class="panel">
        <video autoPlay loop class="key-flip-video">
          <source src="/assets/key-flip.mkv"/>
        </video>

        <div class="start-page-button-div">
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker', {actor: hackathon})} class="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader', {actor: hackathon})} class="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', {actor: hackathon})} class="rainbow-button" style={{width: 180}}></a>
        </div>
      </div>

      
      <button onClick={() =>  whoami()}>Who Am I?</button>
      <button onClick={() => auth.logout()}>Logout</button>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
