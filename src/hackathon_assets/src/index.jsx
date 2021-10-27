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

    // uncomment next line to use with auth
    // await auth.auth(); let x = await auth.getCanisters()

    // uncomment next line to use without auth
    let x = await auth.getAnomymousCanisters()
   
    canisters = auth.canisters
    console.log("useEffect Canisters", x, canisters)
    createWallet()
  }, [])


  return (
    <div class="eventHorizon">
      <h1>Yeet Man’s Switch</h1>
      <h4>Here your secrets are save and sound. As long as you are.</h4>
      <p>Regularly verify that you are alive, otherwise your secret will get published.</p>


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
          <a id="spectator_button" data-text="Spectator" onClick={() => routToPage('Spectator', auth.getProps())} className="rainbow-button" style={{width: 180}}></a>
        </div>
      </div>

      <div class="panel explainer">
        <p><b>Staker 💰</b> deposits $HRBT token to receive key-shares. The bigger the stake, the higher the probability.
        Through key-shares you get involved in decrypting a secret, rewarding you with a juicy payout in $HRBT.</p>
        <p><b>Uploader 🥷🏼</b> enters secret to be held secure. Higher rewards payed by you result in more staker keeping the secret secure.</p>
        <p><b>Spectator 👁</b> gets insight into all revealed secrets. Everybody is a spectator. Even if you do not have an ICP identity yet.</p>
      </div>

      <div class="description-and-wallet">
        <div class="panel explainer-next-to-wallet">
          <p>The Heartbeat Token ($HRBT) 🫀 conforms to the ERC20 protocol. It manifests trust between Staker and Uploaders. 
            Try it out and top up! 💸</p>
        </div>
        <div id="my-wallet"/>
      </div>

      <div class="panel explainer">
        <h3>How it works</h3>
        <p>Secrets are posted by the Uploader. For every secret a private and a public key are generated.
        While the public key is stored onchain, this is not possible for the private key, since it would allow other participants to decrypt the secret.
        In order to avoid a single trusted entity, the private key is split up into n <b>key-shares</b> using <a href="https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing">Shamir's Secret Sharing</a> 🫂 </p>
        <p>The shares are distributed among a multiplicity of staker. If an uploader fails to confirm his lifelines within the time-frame defined by him/her, 
        the staker holding the key-shares are incentivized by a reward (in $HRBT) to decrypt it. 
        The private key associated with the secret can only be reconstructed, if a predefined ratio of key-shares has been decrypted.
        This makes it impossible for a single attacker to reveal a secret.</p>
      </div>   

      <div class="panel explainer">
        <h3>Details ⚙️</h3>
        <p>This is for the nerds.</p>
      </div>      

      <button onClick={() =>  whoami()}>Who Am I?</button>
      <button onClick={async () => {
        
        let hackathonID = await canisters.hackathon.identity();
        let balance = await canisters.token.myBalance();
        let ok = await canisters.token.approve(hackathonID, balance, []); // should not throw error
        await canisters.hackathon.changeToDemoData();
        console.log("Demo Data!")
        location.reload()

        }}>Demo Data!</button>

      <button id="logoutButton" onClick={() => auth.logout()}>Logout</button>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
