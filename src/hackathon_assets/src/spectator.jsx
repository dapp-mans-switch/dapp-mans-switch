import * as React from "react";
import routToPage from './router';

export default function Spectator() {
    return (
      <div>
        <h1>Spectator</h1>
        Look at other people's secrets.
        <br/>
        Here we should display a table with published secrets...
        <br/>
        <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
      </div>
    );
  };