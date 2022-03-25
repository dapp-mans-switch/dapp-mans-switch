import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import { auth } from './auth'
import Wallet from './wallet'

import keyFlipVideoMov from './../assets/key-flip.mov'
import keyFlipVideoWebm from './../assets/key-flip.webm'


export default function Main() {
  const [amount, setAmount] = React.useState(0)
  let canisters = auth.canisters


  // returns principal id of the user's browser (dfx identity api)
  async function whoami() {
    let id = await canisters.hackathon.whoami()
    let s = id.toString()
    console.log("principal", id)

    if (s == '2vxsx-fae') {
      s += " (anonymous)"
    }
    alert("You are " + s);
  }

  // renders wallet component
  async function createWallet() {
    render(React.createElement(Wallet, auth.getProps()), document.getElementById('my-wallet'))
  }

  // populates backend with demo data, only possible in local development
  async function demoMode() {
    let hackathonID = await canisters.hackathon.identity();
    let balance = await canisters.token.myBalance();
    await canisters.token.approve(hackathonID, balance, []); // should not throw error
    await canisters.hackathon.changeToDemoData();
    console.log("Demo Data!")
    location.reload()
  }

  // perform after DOM is built (functional component lifecycle hook)
  React.useEffect(async () => {
    window.scrollTo(0,0);

    // set in webpack.config.js
    if (process.env.AUTHENTICATION) {
      await auth.auth(); await auth.getCanisters()

    } else {
      await auth.getAnomymousCanisters()
    }

    canisters = auth.canisters
    console.log("useEffect Canisters", canisters)
    createWallet()

    if (process.env.DFX_NETWORK === "ic") {
      const demoButton = document.getElementById("demoButton");
      demoButton.remove();
    }
  }, [])


  return (
    <div className="content">
      <h1>dApp Man’s Switch</h1>
      <h3>Here your secrets are safe and sound. As long as you are.</h3>
      <div className="regularly-verify-text">
        <p>Regularly verify that you are alive, otherwise your secret will be published.</p>
      </div>


      <div className="panel">
        <video autoPlay loop muted className="key-flip-video">
          <source src={keyFlipVideoMov}/>
          <source src={keyFlipVideoWebm}/>
        </video>

        <div id="start-if-auth" className="start-page-button-div">
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker', auth.getProps())} className="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
        </div>
        <div id="start-if-not-auth" className="start-page-button-div">
          <a id="loginButton" data-text="Authenticate" className="rainbow-button" style={{width: 220}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
        </div>
      </div>

      <div id="my-wallet"/>

      {/* <button className="bottom-page-button who-am-i-button" onClick={() =>  whoami()}>Who Am I?</button> */}
      <button className="bottom-page-button demo-data-button" id="demoButton" onClick={demoMode}>Demo Mode!</button>

      <button className="bottom-page-button demo-data-button" id="demoButton" onClick={() => routToPage('About', auth.getProps())}>About</button>

      <a href="https://raw.githubusercontent.com/dapp-mans-switch/dapp-mans-switch/0ef758e7f4d6c76a9cc2a43997835b782a5031aa/docs/litepaper/litepaper.pdf" rel="noreferrer">
        <button className="bottom-page-button litepaper-button" id="demoButton">Litepaper</button>
      </a>

      <a href="https://www.youtube.com/watch?v=YAi1gTIxemo" rel="noreferrer">
        <button className="bottom-page-button into-video-button" id="demoButton">Intro Video</button>
      </a>

      <button className="bottom-page-button logout-button" id="logoutButton" onClick={() => auth.logout()}>Logout</button>

    </div>
  );
}

render(<Main />, document.getElementById("app"));
