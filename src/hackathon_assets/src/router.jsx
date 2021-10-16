import * as React from "react";
import { render } from "react-dom";

import Staker from './staker';
import Uploader from './uploader';
import Main from './index';


// this is the router
// import and call routToPage(<name of page(string)>) from any component
export default function routToPage(pageName) {
  switch(pageName) {
    case "Staker":
      render(<Staker />, document.getElementById("app"));
      break;
    case "Uploader":
      render(<Uploader />, document.getElementById("app"));
      break;
    case "Main":
      render(<Main />, document.getElementById("app"));
      break;
    default:
  }
}
