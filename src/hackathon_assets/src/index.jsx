import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import { auth } from './auth'
import Wallet from './wallet'

import keyFlipVideo from './../assets/key-flip.mkv'


export default function Main() {
  const [amount, setAmount] = React.useState(0)
  
  console.log("Main function body")
  let canisters = auth.canisters
  /*if (auth.state == 1) {
    location.reload()
  }*/

  async function whoami() {
    let id = await canisters.hackathon.whoami()
    let s = id.toString()
    console.log("principal", id)

    if (s == '2vxsx-fae') {
      s += " (anonymous)"
    }
    alert("You are " + s);
  }

  async function createWallet() {
    render(React.createElement(Wallet, auth.getProps()), document.getElementById('my-wallet'))
  }

  function logout() {
    auth.logout()
    //location.reload()
  }

  React.useEffect(async () => {
    console.log("useEffect")
    window.scrollTo(0,0);

    // use with auth
    //await auth.auth()
    //let x = await auth.getCanisters()

    // use without auth
    let x = await auth.getAnomymousCanisters()
    // weirdest JS behavior ever! TODO: pls help
    // x can be undefined even though we only return this.canisters (=auth.canisters) in getAnomymousCanisters
    
    canisters = auth.canisters
    console.log("useEffect Canisters", x, canisters)
    createWallet()
  }, [])
  

  return (
    <div class="eventHorizon">
      <h1>Dead Man’s Switch</h1>
      <h3>using Proof of Stake</h3>
      regularly verify that you are alive, otherwise your uploaded files will get published

      <div className="panel">
        <video autoPlay loop muted className="key-flip-video">
          <source src={keyFlipVideo}/>
        </video>

        <div id="start-if-auth" className="start-page-button-div">
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker', auth.getProps())} className="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
        </div>
        <div id="start-if-not-auth" className="start-page-button-div">
          <a id="loginButton" data-text="Authenticate" className="rainbow-button" style={{width: 220}}></a>
        </div>
      </div>

      <div id="my-wallet"/>
      {/* TODO: remove */}
      <button onClick={() =>  whoami()}>Who Am I?</button>
      <button id="logoutButton" onClick={() => logout()}>Logout</button>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
