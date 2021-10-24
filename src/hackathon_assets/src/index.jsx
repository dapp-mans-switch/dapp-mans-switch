import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import Auth from './auth'
import keyFlipVideo from './../assets/key-flip.mkv'
import * as helpers from './helpers'
import { convertTypeAcquisitionFromJson } from '../../../node_modules/typescript/lib/typescript'

// import { token } from '../../declarations/token';

export default function Main() {
  const [amount, setAmount] = React.useState(0)
  let balance = 0
  let canisters
  let identity
  let auth
  let props

  async function authenticate() {
    console.log("AUTHENTICATE")
    document.body.style.backgroundColor = "red"; 
    // if you see this then getCanister is too slow and
    // we should deactivate buttons until the asynchronous function is done

    auth = new Auth()
    let ok = await auth.auth()
    if (ok) {
      identity = await auth.getIdentity()
      canisters = await auth.getCanisters(identity)
      
      props = {canisters: canisters, identity: identity, auth: auth}
      console.log("Identity Principal:", identity.getPrincipal().toString())
    }
    document.body.style.backgroundColor = "#E0E5EC";
  }

  async function no_authenticate() {
    console.log("NO AUTHENTICATE")
    auth = new Auth()
    identity = await auth.getAnomymousIdentity()
    canisters = auth.getAnomymousCanisters()
    props = {canisters: canisters, identity: identity, auth: auth}
    console.log("Identity Principal:", identity.getPrincipal().toString())
    // instead of calling auth.auth(), here we call showMenuIfAuth() directly
    auth.showMenuIfAuth()
    // getBalance(); // TODO remove
  }
  
  async function whoami() {
    console.log(canisters)
    // let id = await canisters.hackathon.whoami()
    // let s = id.toString()
    // console.log("principal", id)

    // if (s == '2vxsx-fae') {
    //   s += " (anonymous)"
    // }
    // alert("You are " + s);
  }

  async function getBalance() {
    balance = await canisters.token.myBalance()
    document.getElementById('balance').innerHTML = "Balance: " + balance + " $HRBT"
  }

  async function buyTokens() {
    try {
      let n_tokens = helpers.getPositiveNumber(amount)
      console.log(canisters)
      await canisters.token.buyIn(n_tokens)
    } catch (error) {
      alert(error)
    }
    getBalance()
  }

  React.useEffect(() => {
    window.scrollTo(0,0);

    // TODO: call at appropriate place
    // authenticate()
    no_authenticate() // for no auth and anonymous identity
    //getBalance()
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
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker', props)} className="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader', props)} className="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', props)} className="rainbow-button" style={{width: 180}}></a>
        </div>
        <div id="start-if-not-auth" className="start-page-button-div">
          <a id="loginButton" data-text="Authenticate" className="rainbow-button" style={{width: 220}}></a>
        </div>
      </div>


      <div className="panel"> 
        <h2>Wallet</h2>
        <h3 id="balance">Balance: 0 $HRBT</h3>
        <label htmlFor="tokenAmount">But tokens:</label>
          <span><input id="tokenAmount" type="number" autoComplete='off' onChange={(ev) => setAmount(ev.target.value)}/></span>
        <button id="money" onClick={() => buyTokens()}>Infinite Money!!</button>
        <button onClick={() => getBalance()}>Show Balance</button>
      </div>

      
      <button onClick={() =>  whoami()}>Who Am I?</button>
      <button id="logoutButton" onClick={() => auth.logout()}>Logout</button>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
