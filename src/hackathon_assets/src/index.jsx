import * as React from 'react'
import { render } from 'react-dom'
import routToPage from './router'
import { auth } from './auth'
import Wallet from './wallet'


import keyFlipVideo from './../assets/key-flip.mkv'


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

    const videosPreload = ['./../assets/key-flip.mkv', './../assets/back_button.mkv']
    videosPreload.forEach((vid) => {
      if (!window[vid]) {
        var newVid = document.createElement("video");
        newVid.setAttribute("src", vid);
        newVid.src = vid;
        window[vid] = newVid;
      }
    })

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
    <div className="eventHorizon">
      <h1>DApp Man’s Switch</h1>
      <h4>Here your Secrets are safe and sound. As long as you are.</h4>
      <p>Regularly verify that you are alive, otherwise your Secret will be published.</p>


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

      {/* <button className="bottom-page-button who-am-i-button" onClick={() =>  whoami()}>Who Am I?</button> */}
      <button className="bottom-page-button demo-data-button" id="demoButton" onClick={demoMode}>Demo Mode!</button>

      <button className="bottom-page-button logout-button" id="logoutButton" onClick={() => auth.logout()}>Logout</button>

      <div className="panel explainer">
        <p><b>Staker &#128176;</b> stakes $HRBT tokens to receive key-shares. The bigger the stake, the higher the probability to receive shares.
        Through key-shares you get involved in decrypting a Secret, rewarding you with a juicy payout in $HRBT.</p>
        <p><b>Uploader &#129399;</b> enters a Secret to be held secure. Higher rewards paid by you result in more Stakers keeping the Secret secure.</p>
        <p><b>Spectator &#128065;</b> gets insight into all revealed Secrets. Everybody is a spectator, and no ICP identity is necessary.</p>
      </div>

      <div className="description-and-wallet">
        <div className="panel explainer-next-to-wallet">
          <p>The Heartbeat Token ($HRBT) &#129728; conforms to the ERC20 protocol. It manifests trust between Stakers and Uploaders.
            Try it out and top up! &#128184;</p>
        </div>
        <div id="my-wallet" style= {{ marginLeft: "40px" }}/>
      </div>

      <div className="panel explainer">
        <h3>How it Works</h3>
        <p>Secrets are posted by the Uploader. For every Secret a private and a public key are generated.
        While the public key is stored on-chain, this is not possible for the private key, since it would allow other participants to decrypt Secrets.
        In order to avoid a single trusted entity, the private key is split up into multiple <b>key-shares</b> among randomly selected Stakers. &#129730; </p>

        <p>If an Uploader fails to confirm his liveliness within the time-frame defined by him/her,
        the Stakers holding the key-shares are incentivized by a reward (in $HRBT) to decrypt the Secret.
        The private key to decrypt the Secret can only be reconstructed if the majority of key-shares has been decrypted.
        This makes it extremely improbable for a single entity holding less than 51% of the $HRBT tokens to reveal a Secret. &#128271;</p>
      </div>

      <div className="panel explainer">
        <h3>Details</h3>
        <p>This is for the nerds.</p>
        <p>
          The $HRBT token is managed by an independent canister and is ERC20 compliant.
          In the future users can exchange $HRBT for cycles, ICP, or any common crypto currency.
          Users are authenticated by their <a href="https://identity.ic0.app">Internet Identity</a> and the tokens are stored at their principal.
        </p>
        <p>
          If users want to participate as stakers in order to receive rewards, a cryptographic key-pair is generated locally at their device as they registers.
          The public key is shared and used to encrypt key-shares, while the private key is to be stored securely and is used to decrypt and reveal the key-shares.
          This makes sure that users can only decrypt and read the key-shares which belong to them.
        </p>
        <p>
          In order to receive key-shares and rewards, users have to stake their tokens.
          In this process, a custom amount of tokens are temporarily transferred to the wallet of the main canister.
          Of course, the tokens are transferred back when the users end their stakes.
          If they decide to end their stakes early, they will only get back half of their staked tokens.
          All active stakes are in the pool to receive key-shares.
        </p>
        <p>
          If users want to upload a secret, they can specify a reward, heartbeat frequency, and expiry date.
          Locally at their device, a cryptographic key-pair is generated which is used to encrypt the secret.
          The private-key is split by the means of <a href="https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing">Shamir&apos;s Secret Sharing</a>.
          More than half of the shares are required to reconstruct the private-key and consequently to decrypt the secret.
          A higher reward means more shares are generated, currently up to 255.
        </p>
        <p>
          The main canister is called to draw stakes which receive a key-share.
          Only stakes which expire <i>after</i> the secret's expiry data are considered in the raffle.
          This guarantees that the key-share holders are long enough around to reveal their share if necessary.
        </p>
        <p>
          In the lottery, stakes are chosen proportionately to their stake amount at random.
          Basis for that is a Pseudo-Random-Number-Generator for efficient sampling.
          The seed for this procedure is derived from the cryptographic entropy source provided by the Internet Computer to ensure a tamper proof distribution of key-shares.
          The uploaders can only select the stakes drawn by the main canister.
          This makes sure that distribution of key-shares is fair and cannot be influenced by the uploaders.
        </p>
        <p>
          Once the uploaders know which stakes and stakers receive a key-share, they encrypt the shares with the public key of the stakers.
          Furthermore, they create a SHA256 hash from the <i>decrypted</i> key-shares.
          This hash is used to verify that the stakers indeed reveal the correct decrypted key-shares when needed.
          A staker cannot just upload something random and receive a reward.
        </p>
        <p>
          Once the uploaders have uploaded their secret, they have to proof their liveliness at intervals specified by the heartbeat frequency.
          If they fail to do so, then this signal the stakers that it is time to decrypt their key-shares with their private key and upload them.
          The main canister only allows to upload decrypted key-shares, if it conforms to the described protocol.
          For their action, stakers are rewarded proportionately to their amount of managed key-shares.
          If the uploaders prove their liveliness until the set expiry time, the secret remains encrypted and stakers also receive their payout.
        </p>
      </div>
    </div>
  );
}

render(<Main />, document.getElementById("app"));
