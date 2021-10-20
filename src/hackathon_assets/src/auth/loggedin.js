import { html, render } from "lit-html";
import { renderLoginForm } from "./loginform";
//import { _SERVICE } from "../../../declarations/hackathon/hackathon.did";

const content = () => html`<div class="container">
  <style>
    #whoami {
      border: 1px solid #1a1a1a;
      margin-bottom: 1rem;
    }
  </style>
  <h1>Internet Identity Client</h1>
  <h2>You are authenticated!</h2>
  <p>To see how a canister views you, click this button!</p>
  <button type="button" id="whoamiButton" class="primary">Who am I?</button>
  <input type="text" readonly id="whoami" placeholder="your Identity" />
  <button id="logout">log out</button>
</div>`;

export const renderLoggedIn = (actor, authClient) => {
  render(content(), document.getElementById("app"));

  (document.getElementById("whoamiButton")).onclick =
    async () => {
      try {
        console.log(actor);
        const response = await actor.whoami();
       
        console.log(response);
        (document.getElementById("whoami")).value =
          response.toString();
      } catch (error) {
        console.error(error);
      }
    };

  (document.getElementById("logout")).onclick =
    async () => {
      await authClient.logout();
      renderLoginForm();
    };
};
