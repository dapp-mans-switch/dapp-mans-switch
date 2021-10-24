import * as React from 'react'
import routToPage from './router'
import * as helpers from './helpers'
import * as crypto from './crypto'

import backButtonVideo from './../assets/back_button.mkv'


export default function Spectator(props) {
  const hackathon = props.canisters.hackathon;

  async function listAllSecrets() {
    
    let secrets = await hackathon.listAllSecrets()
    secrets.sort(function(a, b) { 
      return - (parseInt(b.secret_id) - parseInt(a.secret_id));
    });

    console.log("Secrets", secrets)

    const alltable = document.getElementById('secretsTable')

    alltable.innerHTML = ''
    const tr = alltable.insertRow(-1)
    for (const cn of ['Secret ID', 'Reveal Progress', 'Expiry Time', 'Last Heartbeat']) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    const dectable = document.getElementById('decryptedSecretsTable')
    dectable.innerHTML = ''
    const dec_tr = dectable.insertRow(-1)
    for (const cn of ['Secret ID', 'Payload']) {
      const tabCell = dec_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    secrets.map(function (s) {
      let n_shares = s.shares.length;
      let n_revealed = s.revealed.reduce((a,b) => a + b, 0);

      let canDecrypted = crypto.enoughSharesToDecrypt(n_shares, n_revealed);
      if (canDecrypted) {
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
        const tr = alltable.insertRow(-1)

        const idCell = tr.insertCell(-1)
        idCell.innerHTML = s.secret_id

        const progressCell = tr.insertCell(-1)
        const minReveal = crypto.minSharesToRecover(n_shares)
        progressCell.innerHTML = (n_revealed / minReveal * 100.0).toLocaleString(undefined, { minimumFractionDigits: 2}) + " %"
      
        const expiryCell = tr.insertCell(-1)
        expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()

        const heartbeatCell = tr.insertCell(-1)
        heartbeatCell.innerHTML = helpers.secondsSinceEpocheToDate(s.last_heartbeat).toLocaleString()
      }
    });
  }
  
  React.useEffect(() => {
    listAllSecrets()
  }, [])


    return (
      <div class="eventHorizon">
        <div class="header-n-nav">
          <a onClick={() => {routToPage('Main')}}>
            <video autoPlay loop muted class="back-button-video">
              <source src={backButtonVideo}/>
            </video>
          </a>
          <h1>Spectator</h1>
        </div>

        Look at other people's secrets.
        <div>
         <button onClick={() => listAllSecrets()}>Refresh</button>
        </div>

        <div className="panel">
            <h2>Live Secrets</h2>
            <table id="secretsTable" cellPadding={5}/>
        </div>

        <div className="panel">
            <h2>Decrypted Secrets</h2>
            <table id="decryptedSecretsTable" cellPadding={5}/>
        </div>
        <button onClick={() => {routToPage('Main')}}>Back to Start Page</button>
      </div>
    );
  };