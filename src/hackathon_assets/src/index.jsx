import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'

import Auth from './auth/auth'


export default function Main() {

  async function testAuth() {
    let auth = new Auth()
    await auth.auth()
    //let actor = await auth.getCanister()
  }
  testAuth()
  
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
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker')} class="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader')} class="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator')} class="rainbow-button" style={{width: 180}}></a>
        </div>
      </div>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
