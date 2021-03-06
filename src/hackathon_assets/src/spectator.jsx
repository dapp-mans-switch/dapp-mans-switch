import * as React from 'react'
import routeToPage from './router'
import * as helpers from './helpers'
import * as crypto from './crypto'
import { min } from 'mathjs'

import backButtonVideoMov from './../assets/back-button.mov'
import backButtonImage from './../assets/back-button.png'
import backButtonVideoWebm from './../assets/back-button.webm'

export default function Spectator(props) {
  const hackathon = props.canisters.hackathon;

  async function listAllSecrets() {

    let secrets = await hackathon.listAllSecretsPlusRevealInfo()
    secrets.sort(function(a, b) {
      return - (parseInt(b[0].secret_id) - parseInt(a[0].secret_id));
    });

    console.log("Secrets", secrets)

    const altable = document.getElementById('aliveSecretsTable')
    altable.innerHTML = ''
    const al_tr = altable.insertRow(-1)
    for (const cn of ['<b>ID<b/>', '<b>Expires on<b/>', '<b>Last heartbeat<b/>']) {
      const tabCell = al_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    const revtable = document.getElementById('revealSecretsTable')
    revtable.innerHTML = ''
    const rev_tr = revtable.insertRow(-1)
    for (const cn of ['<b>ID<b/>', '<b>Reveal progress<b/>']) {
      const tabCell = rev_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    const dectable = document.getElementById('decryptedSecretsTable')
    dectable.innerHTML = ''
    const dec_tr = dectable.insertRow(-1)
    for (const cn of ['<b>ID<b/>', '<b>Payload<b/>']) {
      const tabCell = dec_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    const exptable = document.getElementById('expiredSecretsTable')
    exptable.innerHTML = ''
    const exp_tr = exptable.insertRow(-1)
    for (const cn of ['<b>ID<b/>', '<b>Expired on<b/>']) {
      const tabCell = exp_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    secrets.map(function (x) {
      let s = x[0]
      let revealInProgress = x[1]

      let n_shares = s.shares.length;
      let n_revealed = s.revealed.reduce((a,b) => a + b, 0);
      let canDecrypt = crypto.enoughSharesToDecrypt(n_shares, n_revealed);
      if (canDecrypt) {
        try {
          let keyshares = {}
          for (let i=0; i<n_shares; i++) {
            let share = s.shares[i]
            let ok = s.revealed[i]
            if (ok) {
              keyshares[i+1] = crypto.base64ToKeyShare(share)
            }
          }
          const reconstructedPrivateKey = crypto.reconstructPrivateKey(keyshares)
          const payload = crypto.decryptSecret(s.payload, reconstructedPrivateKey)

          const tr = dectable.insertRow(-1)

          const idCell = tr.insertCell(-1)
          idCell.innerHTML = s.secret_id

          const payloadCell = tr.insertCell(-1)
          payloadCell.innerHTML = payload

        } catch (error) {
          console.log(error)
        }
      } else {
        // secret cannot be decrypted
        if (revealInProgress) {
          console.log(n_revealed)
          const tr = revtable.insertRow(-1)

          const idCell = tr.insertCell(-1)
          idCell.innerHTML = s.secret_id

          const progressCell = tr.insertCell(-1)
          const minReveal = crypto.minSharesToRecover(n_shares)
          progressCell.innerHTML = (min(n_revealed, minReveal) / minReveal * 100.0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2}) + " %"

        } else {
          let now = new Date() / 1000;
          if (s.expiry_time < now) {
            // secret has expired and cannot be decrypted -> author sent all required heartbeats
            const tr = exptable.insertRow(-1)

            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id

            const expiryCell = tr.insertCell(-1)
            expiryCell.innerHTML = helpers.secondsSinceEpocheToISO8601(s.expiry_time)
          } else {
            // secret is alive

            const tr = altable.insertRow(-1)

            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id

            const expiryCell = tr.insertCell(-1)
            expiryCell.innerHTML = helpers.secondsSinceEpocheToISO8601(s.expiry_time)

            const heartbeatCell = tr.insertCell(-1)
            heartbeatCell.innerHTML = helpers.secondsSinceEpocheToISO8601(s.last_heartbeat)
          }
        }
      }
    });
  }

  window.onpopstate = goBack
  history.pushState({}, '')

  React.useEffect(() => {
    listAllSecrets()
  }, [])

  function goBack() {
    routeToPage('Main')
  }

  return (
    <div className="content">
    <div className="header-n-nav">
    <a onClick={() => {goBack()}}>
    <video autoPlay loop muted className="back-button-video" poster={backButtonImage}>
      <source src={backButtonVideoMov}/>
      <source src={backButtonVideoWebm}/>
    </video>
    </a>
    <h1>Spectator</h1>
    </div>

    <p>Look at other people&apos;s Secrets.</p>

    <div>
    <a id="staker_button" data-text="Refresh" onClick={() => listAllSecrets()} className="rainbow-button" style={{width: 150}}></a>
    </div>

    <div className="panel">
    <h2>Decrypted Secrets &#128275;</h2>
    <table id="decryptedSecretsTable" cellPadding={5}/>
    </div>
    <div className="panel">
    <h2>Live Secrets &#128147;</h2>
    <table id="aliveSecretsTable" cellPadding={5}/>
    </div>

    <div className="panel">
    <h2>Secrets being Revealed &#9201;</h2>
    <table id="revealSecretsTable" cellPadding={5}/>
    </div>

    <div className="panel">
    <h2>Expired Secrets &#128274;</h2>
    <table id="expiredSecretsTable" cellPadding={5}/>
    </div>

    <a onClick={() => {routeToPage('Main')}}>
    <video autoPlay loop muted className="back-button-big" poster={backButtonImage}>
      <source src={backButtonVideoMov}/>
      <source src={backButtonVideoWebm}/>
    </video>
    </a>

    </div>
  );
}
