import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import { auth } from './auth'
import Wallet from './wallet'


import keyFlipVideo from './../assets/key-flip.mkv'
import { hackathon } from '../../declarations/hackathon/index'


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

  // perform after DOM is built (functional component lifecycle hook)
  React.useEffect(async () => {
    window.scrollTo(0,0);

    const videosPreload = ['./../assets/key-flip.mkv', './../assets/back_button.mkv']
    videosPreload.forEach((vid) => {
      if (!window[vid]) {
        var newVid = document.createElement("video");
        newVid.setAttribute("src", vid);
        newVid.src = vid;
        window[vid] = newVid;
      }
    })

    // uncomment next line to use with auth
    // await auth.auth(); let x = await auth.getCanisters()

    // uncomment next line to use without auth
    let x = await auth.getAnomymousCanisters()

    canisters = auth.canisters
    console.log("useEffect Canisters", x, canisters)
    createWallet()
  }, [])


  return (
    <div className="eventHorizon">
      <h1>Dead Man’s Switch</h1>
      <h4>Here your Secrets are save and sound. As long as you are.</h4>
      <p>Regularly verify that you are alive, otherwise your Secret will get published.</p>


      <div className="panel">
        <video autoPlay loop muted className="key-flip-video" type="video/webm">
          <source src={keyFlipVideo}/>
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

      <div className="panel explainer">
        <p><b>Staker 💰</b> stakes $HRBT tokens to receive key-shares. The bigger the stake, the higher the probability to receive shares.
        Through key-shares you get involved in decrypting a Secret, rewarding you with a juicy payout in $HRBT.</p>
        <p><b>Uploader 🥷🏼</b> enters a Secret to be held secure. Higher rewards payed by you result in more Stakers keeping the Secret secure.</p>
        <p><b>Spectator 👁</b> gets insight into all revealed Secrets. Everybody is a spectator, and no ICP identity is necessary.</p>
      </div>

      <div className="description-and-wallet">
        <div className="panel explainer-next-to-wallet">
          <p>The Heartbeat Token ($HRBT) 🫀 conforms to the ERC20 protocol. It manifests trust between Stakers and Uploaders.
            Try it out and top up! 💸</p>
        </div>
        <div id="my-wallet"/>
      </div>

      <div className="panel explainer">
        <h3>How it Works</h3>
        <p>Secrets are posted by the Uploader. For every Secret a private and a public key are generated.
        While the public key is stored on-chain, this is not possible for the private key, since it would allow other participants to decrypt Secrets.
        In order to avoid a single trusted entity, the private key is split up into multiple <b>key-shares</b> among randomly selected Stakers. 🫂 </p>
        
        <p>If an Uploader fails to confirm his liveliness within the time-frame defined by him/her,
        the Stakers holding the key-shares are incentivized by a reward (in $HRBT) to decrypt the Secret.
        The private key to decrypt the Secret can only be reconstructed if the majority of key-shares has been decrypted.
        This makes it extremely improbable for a single entity holding less than 51% of the $HRBT tokens to reveal a Secret.</p>
      </div>

      <div className="panel explainer">
        <h3>Details ⚙️</h3>
        <p>This is for the nerds.</p>
        The way that the key-shares are distributed amongst the Stakers is based on <a href="https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing">Shamir&apos;s Secret Sharing</a>.
      </div>

      <button className="bottom-page-button who-am-i-button" onClick={() =>  whoami()}>Who Am I?</button>
      <button className="bottom-page-button demo-data-button" onClick={async () => {

        let hackathonID = await canisters.hackathon.identity();
        let balance = await canisters.token.myBalance();
        await canisters.token.approve(hackathonID, balance, []); // should not throw error
        await canisters.hackathon.changeToDemoData();
        console.log("Demo Data")
        location.reload()

        }}>Demo Data</button>

      <button className="bottom-page-button logout-button" id="logoutButton" onClick={() => auth.logout()}>Logout</button>

    </div>
  );
}

render(<Main />, document.getElementById("app"));
