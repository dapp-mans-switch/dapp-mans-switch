import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import Auth from './auth'

import keyFlipVideo from './../assets/key-flip.mkv'
import cityImage from './../assets/city.jpg'


export default function Main() {

  let hackathon
  let identity
  let auth

  let props

  async function authenticate() {
    document.body.style.backgroundColor = "red"; 
    // if you see this then getCanister is too slow and
    // we should deactivate buttons until the asynchronous function is done

    auth = new Auth()
    let ok = await auth.auth()
    if (ok) {
      identity = await auth.getIdentity()
      hackathon = await auth.getCanister(identity)
      
      props = {actor: hackathon, identity: identity, auth: auth}
      console.log("Identity Principal:", identity.getPrincipal().toString())
    }

    document.body.style.backgroundColor = "#E0E5EC";
  }

  async function no_authenticate() {
    auth = new Auth()
    identity = await auth.getAnomymousIdentity()
    hackathon = auth.getAnomymousCanister()
    props = {actor: hackathon, identity: identity, auth: auth}
    console.log("Identity Principal:", identity.getPrincipal().toString())
    // instead of calling auth.auth(), here we call showMenuIfAuth() directly
    auth.showMenuIfAuth()
  }
  
  // authenticate()
  no_authenticate() // for no auth and anonymous identity


  async function whoami() {
    let id = await hackathon.whoami()
    let s = id.toString()
    console.log("principal", id)

    if (s == '2vxsx-fae') {
      s += " (anonymous)"
    }
    alert("You are " + s);
  }

  React.useEffect(() => {
    document.body.style.backgroundColor = "#E0E5EC";
  })
  

  return (
    <div>
      <h1>Dead Man’s Switch</h1>
      <h3>using Proof of Stake</h3>
      regularly verify that you are alive, otherwise your uploaded files will get published

      <div class="panel">
        <video autoPlay loop muted class="key-flip-video">
          <source src={keyFlipVideo}/>
        </video>

        <div id="start-if-auth" class="start-page-button-div">
          <a id="staker_button" data-text="Staker" onClick={() => routToPage('Staker', props)} class="rainbow-button" style={{width: 150}}></a>
          <a id="uploader_button" data-text="Uploader" onClick={() => routToPage('Uploader', props)} class="rainbow-button" style={{width: 180}}></a>
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', props)} class="rainbow-button" style={{width: 180}}></a>
        </div>
        <div id="start-if-not-auth" class="start-page-button-div">
          <a id="loginButton" data-text="Authenticate" class="rainbow-button" style={{width: 220}}></a>
        </div>
      </div>

      
      <button onClick={() =>  whoami()}>Who Am I?</button>
      <button id="logoutButton" onClick={() => auth.logout()}>Logout</button>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
