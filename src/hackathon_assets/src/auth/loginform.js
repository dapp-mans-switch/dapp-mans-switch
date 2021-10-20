import { html, render } from "lit-html";
const content = html`<div class="container">
  <h1>Internet Identity Client</h1>
  <h2>You are not authenticated</h2>
  <p>To log in, click this button!</p>
  <button type="button" id="loginButton">Log in</button>
</div>`;

export const renderLoginForm = async () => {
  render(content, document.getElementById("app"));
};

/*
export default function LoginForm() {
    return (
        <div class="container">
            <h1>Internet Identity Client</h1>
            <h2>You are not authenticated</h2>
            <p>To log in, click this button!</p>
            <button type="button" id="loginButton">Log in</button>
        </div>
    )
}*/