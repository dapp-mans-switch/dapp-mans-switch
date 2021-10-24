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

    const table = document.getElementById('secretsTable')

    const col_names = ['secret_id', 'n_shares', 'n_revealed', 'expiry_time', 'last_heartbeat']
    table.innerHTML = ''

    const tr = table.insertRow(-1)
    for (const cn of col_names) {
      const tabCell = tr.insertCell(-1)
      tabCell.innerHTML = cn
    }

    secrets.map(function (s) {
      let n_shares = s.shares.length;
      let n_revealed = s.revealed.reduce((a,b) => a + b, 0);
      const tr = table.insertRow(-1)
      tr.addEventListener("click", function() {
        if (crypto.enoughSharesToDecrypt(n_shares, n_revealed)) {
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

            alert("Decrypted secret " + payload)
          } catch (error) {
            console.log(error)
          }
        
        } else {
          alert("Cannot decrypt")
        }
      })

      const idCell = tr.insertCell(-1)
      idCell.innerHTML = s.secret_id

      const sharesCell = tr.insertCell(-1)
      sharesCell.innerHTML = n_shares

      const revealedCell = tr.insertCell(-1)
      revealedCell.innerHTML = n_revealed

    
      const expiryCell = tr.insertCell(-1)
      expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()

      const heartbeatCell = tr.insertCell(-1)
      heartbeatCell.innerHTML = helpers.secondsSinceEpocheToDate(s.last_heartbeat).toLocaleString()
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
        <button onClick={() => listAllSecrets()}>Refresh</button>
        <div className="panel">
                <h2>My Secrets</h2>
                <table id="secretsTable" cellPadding={5}/>
        </div>
        <button onClick={() => {routToPage('Main')}}>Back to Start Page</button>
      </div>
    );
  };