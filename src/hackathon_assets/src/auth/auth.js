import { AuthClient } from "@dfinity/auth-client";

import { renderLoginForm } from "./loginform";
import { renderLoggedIn } from "./loggedin";
import { canisterId, createActor } from '../../../declarations/hackathon';


export default class Auth {

    async auth() {
        this.authClient = await AuthClient.create();
        if (await this.authClient.isAuthenticated()) {
            console.log("authenticated")
            const identity = await this.authClient.getIdentity();
            console.log("identity", identity.getPrincipal().toString())
            this.handleAuthenticated(this.authClient)
            //renderLoginForm()
        } else {
            console.log("not authenticated")
            renderLoginForm()

            const loginButton = document.getElementById(
                "loginButton"
              );
            
            const days = BigInt(1);
            const hours = BigInt(24);
            const nanoseconds = BigInt(3600000000000);
        
            console.log("process env", process.env.DFX_NETWORK,  process.env.LOCAL_II_CANISTER)

            loginButton.onclick = async () => {
                await this.authClient.login({
                    onSuccess: async () => {
                        const identity = await this.authClient.getIdentity();
                        console.log("Success", identity.getPrincipal().toString())
                        this.handleAuthenticated(this.authClient)
                    },
                    identityProvider:
                        process.env.DFX_NETWORK === "ic"
                            ? "https://identity.ic0.app/#authorize"
                            : process.env.LOCAL_II_CANISTER,
                    // Maximum authorization expiration is 8 days
                    maxTimeToLive: days * hours * nanoseconds,
                });
            };
        }

        return this
    }

    async handleAuthenticated(authClient) {
        const identity = await authClient.getIdentity();
        console.log(identity)
        const actor = createActor(canisterId, {
          agentOptions: {
            identity,
          },
        });
      
        renderLoggedIn(actor, authClient);
      }

    /*async getCanister() {
        const identity = await this.authClient.getIdentity();
        console.log("Get canister for identity", identity.getPrincipal().toString())
        const actor = createActor(canisterId, {
            agentOptions: {
                identity,
            },
        })
        console.log(actor)
        //let hello = await actor.whoami()
        let hello = await actor.sharedGreet("test")
        console.log(hello);
    }*/
};