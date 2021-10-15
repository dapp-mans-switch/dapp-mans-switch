import * as React from "react";
import { render } from "react-dom";
import { hackathon } from "../../declarations/hackathon";
import routToPage from './router';

export default function Uploader() {

    return(
        <div>
            Hello, I'm an uploader.
            <button onClick={() => {routToPage("Main")}}>Back to Start Page</button>
        </div>
    )
};