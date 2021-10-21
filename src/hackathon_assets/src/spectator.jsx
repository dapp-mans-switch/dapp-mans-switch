import * as React from 'react'
import routToPage from './router'
import * as helpers from './helpers'

export default function Spectator(props) {
  const hackathon = props.actor;

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
      const tr = table.insertRow(-1)

      const idCell = tr.insertCell(-1)
      idCell.innerHTML = s.secret_id

      const sharesCell = tr.insertCell(-1)
      sharesCell.innerHTML = s.shares.length

      const revealedCell = tr.insertCell(-1)
      revealedCell.innerHTML = s.revealed.reduce((a,b) => a + b, 0)

    
      const expiryCell = tr.insertCell(-1)
      expiryCell.innerHTML = helpers.secondsSinceEpocheToDate(s.expiry_time).toLocaleString()

      const heartbeatCell = tr.insertCell(-1)
      heartbeatCell.innerHTML = helpers.secondsSinceEpocheToDate(s.last_heartbeat).toLocaleString()
    });
  }
  
  React.useEffect(() => {
    listAllSecrets()
  })


    return (
      <div>
        <h1>Spectator</h1>
        Look at other people's secrets.
        <button onClick={() => listAllSecrets()}>Refresh</button>
        <div class="panel">
                <h2>My Secrets</h2>
                <table id="secretsTable" cellPadding={5}/>
        </div>
        <button onClick={() => {routToPage('Main')}}>Back to Start Page</button>
      </div>
    );
  };