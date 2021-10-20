import { AuthClient } from "@dfinity/auth-client";

import { canisterId, createActor } from '../../../declarations/hackathon';

import routToPage from '../router'


export default class Auth {

    async auth() {
        this.authClient = await AuthClient.create();
        if (await this.authClient.isAuthenticated()) {
            const identity = await this.authClient.getIdentity();
            console.log("authenticated: identity", identity.getPrincipal().toString())
        } else {
            console.log("not authenticated")
            routToPage('LoginForm')
            this.makeLoginButton()
        }

        return this
    }

    makeLoginButton() {
        const loginButton = document.getElementById(
            "loginButton"
          );
        
        const days = BigInt(1);
        const hours = BigInt(24);
        const nanoseconds = BigInt(3600000000000);

        loginButton.onclick = async () => {
            await this.authClient.login({
                onSuccess: async () => {
                    const identity = await this.authClient.getIdentity();
                    console.log("Success", identity.getPrincipal().toString())
                    routToPage('Main')
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


    async getCanister() {
        const identity = await this.authClient.getIdentity();
        console.log("Get canister for identity", identity.getPrincipal().toString())
        const actor = createActor(canisterId, {
            agentOptions: {
                identity,
            },
        })
        return actor;
    }
    
    async logout() {      
        await this.authClient.logout();
        routToPage('LoginForm')
        this.makeLoginButton()
    }
};