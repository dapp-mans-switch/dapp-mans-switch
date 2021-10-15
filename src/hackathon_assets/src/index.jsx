import * as React from "react";
import { render } from "react-dom";
import { hackathon } from "../../declarations/hackathon";
import routToPage from './router';


export default function Main() {
  
  return (
    <div>
    
      <h1>Dead Man’s Switch</h1>
      <h3>using Proof of Stake</h3>
      
      regularly verify that you are alive, otherwise your uploaded files will get published

      <a id="staker_button" data-text="Staker" onClick={() => routToPage("Staker")} class="rainbow-button" style={{width: 150}}></a>
      <a id="uploader_button" data-text="Uploader" onClick={() => routToPage("Uploader")} class="rainbow-button" style={{width: 180}}></a>

    </div>
  );
};

render(<Main />, document.getElementById("app"));
