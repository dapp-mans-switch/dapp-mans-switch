import * as React from "react";
import { render } from "react-dom";
import { hackathon } from "../../declarations/hackathon";

import { Link } from 'react-router-dom';
// import Staker from "./staker"; 
// <Route path="staker" component={Staker} /> 

const Staker = () => {
  const [name, setName] = React.useState('');
  const [message, setMessage] = React.useState('');
  
  async function doGreet() {
    const greeting = await hackathon.greet(name);
    setMessage(greeting);
  }
  
  return (
    <div>
      <h1>Staker</h1>
      This is the staker Page
      <Link to="/staker">GO TO STAKER</Link>
      <a id="staker_button" data-text="Staker" class="rainbow-button" style={{width: 150}}></a>
      <a id="uploader_button" data-text="Uploader" class="rainbow-button" style={{width: 180}}></a>

    {/* <div style={{ margin: "30px" }}>
    <input
    id="name"
    value={name}
    onChange={(ev) => setName(ev.target.value)}
    ></input>
    <button onClick={doGreet}>Get Greeting!</button>
    </div>
    <div>
    Greeting is: "
        <span style={{ color: "blue" }}>{message}</span>"
    </div> */}
    </div>
  );
};

render(<Main />, document.getElementById("app"));