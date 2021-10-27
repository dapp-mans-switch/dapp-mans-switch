import * as React from 'react'
import routToPage from './router'
import * as helpers from './helpers'
import * as crypto from './crypto'
import { min } from 'mathjs'

import backButtonVideo from './../assets/back_button.mkv'


export default function Spectator(props) {
  const hackathon = props.canisters.hackathon;
  
  async function listAllSecrets() {
    
    let secrets = await hackathon.listAllSecrets()
    secrets.sort(function(a, b) {
      return - (parseInt(b.secret_id) - parseInt(a.secret_id));
    });
    
    console.log("Secrets", secrets)
    
    const altable = document.getElementById('aliveSecretsTable')
    altable.innerHTML = ''
    const al_tr = altable.insertRow(-1)
    for (const cn of ['Secret ID', 'Expires on', 'Last heartbeat']) {
      const tabCell = al_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    
    const revtable = document.getElementById('revealSecretsTable')
    revtable.innerHTML = ''
    const rev_tr = revtable.insertRow(-1)
    for (const cn of ['Secret ID', 'Reveal progress']) {
      const tabCell = rev_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    
    const dectable = document.getElementById('decryptedSecretsTable')
    dectable.innerHTML = ''
    const dec_tr = dectable.insertRow(-1)
    for (const cn of ['Secret ID', 'Payload']) {
      const tabCell = dec_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    
    const exptable = document.getElementById('expiredSecretsTable')
    exptable.innerHTML = ''
    const exp_tr = exptable.insertRow(-1)
    for (const cn of ['Secret ID', 'Expires on']) {
      const tabCell = exp_tr.insertCell(-1)
      tabCell.innerHTML = cn
    }
    
    secrets.map(function (s) {
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
          
          /* TODO: remove
          console.log("keyshares", s.shares)
          
          console.log("Encrypted Secret", crypto.encryptSecret("Internet Computer Rocks!", reconstructedPrivateKey) )
          console.log("Encrypted Secret", crypto.encryptSecret("Dfinity is cool!", reconstructedPrivateKey) )
          console.log("Encrypted Secret", crypto.encryptSecret("I'm glad there is a decentralised Dead Man's Switch!", reconstructedPrivateKey) )
          console.log("Encrypted Secret", crypto.encryptSecret("Here, is my password: password123", reconstructedPrivateKey) )
          console.log("Encrypted Secret", crypto.encryptSecret("Wallet key: oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==", reconstructedPrivateKey) )
          
          */
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
        let now = new Date() / 1000;
        if (s.expiry_time < now) {
          // secret has expired and cannot be decrypted -> author sent all required heartbeats
          const tr = exptable.insertRow(-1)
          
          const idCell = tr.insertCell(-1)
          idCell.innerHTML = s.secret_id
          
          const expiryCell = tr.insertCell(-1)
          expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()
        } else {
          // secret can be alive or reveal is in progress
          if (s.last_heartbeat + s.heartbeat_freq < now) {
            console.log(n_revealed)
            const tr = revtable.insertRow(-1)
            
            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id
            
            const progressCell = tr.insertCell(-1)
            const minReveal = crypto.minSharesToRecover(n_shares)
            progressCell.innerHTML = (min(n_revealed, minReveal) / minReveal * 100.0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2}) + " %"
            
          } else {
            const tr = altable.insertRow(-1)
            
            const idCell = tr.insertCell(-1)
            idCell.innerHTML = s.secret_id
            
            const expiryCell = tr.insertCell(-1)
            expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()
            
            const heartbeatCell = tr.insertCell(-1)
            heartbeatCell.innerHTML = helpers.secondsSinceEpocheToDate(s.last_heartbeat).toLocaleString()
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
    routToPage('Main')
  }
  
  return (
    <div className="eventHorizon">
    <div className="header-n-nav">
    <a onClick={() => {goBack()}}>
    <video autoPlay loop muted className="back-button-video">
    <source src={backButtonVideo}/>
    </video>
    </a>
    <h1>Spectator</h1>
    </div>
    
    Look at other people&apos;s Secrets.
    
    <div>
    <a id="staker_button" data-text="Refresh" onClick={() => listAllSecrets()} className="rainbow-button" style={{width: 150}}></a>
    </div>
    
    <div className="panel">
    <h2>Decrypted Secrets &#128275;</h2>
    <table id="decryptedSecretsTable" cellPadding={5}/>
    </div>
    <div className="panel">
    <h2>Secrets with Alive Author &#128147;</h2>
    <table id="aliveSecretsTable" cellPadding={5}/>
    </div>
    
    <div className="panel">
    <h2>Secrets with Reveal in Progress &#9201;</h2>
    <table id="revealSecretsTable" cellPadding={5}/>
    </div>
    
    <div className="panel">
    <h2>Expired Secrets &#128274;</h2>
    <table id="expiredSecretsTable" cellPadding={5}/>
    </div>
    
    <a onClick={() => {routToPage('Main')}}>
    <video autoPlay loop muted className="back-button-big">
    <source src={backButtonVideo}/>
    </video>
    </a>
    
    </div>
    );
  }
  