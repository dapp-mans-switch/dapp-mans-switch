import { AuthClient } from "@dfinity/auth-client";

import * as hackathon from '../../declarations/hackathon';
import * as token from '../../declarations/token';

import routToPage from './router'


export default class Auth {

    // show navigation and logout buttons if authenticated
    showMenuIfAuth() {
        document.getElementById("start-if-not-auth").style.display = "none";
        document.getElementById("start-if-auth").style.display = "flex";
        document.getElementById("logoutButton").style.display = "initial";
    }

    // show authenticate button but hide logout button
    showMenuIfNotAuth() {
        document.getElementById("start-if-not-auth").style.display = "flex";
        document.getElementById("start-if-auth").style.display = "none";
        this.makeLoginButton()
        document.getElementById("logoutButton").style.display = "none";
    }

    async auth() {
        this.authClient = await AuthClient.create();
        if (await this.authClient.isAuthenticated()) {
            //const identity = await this.authClient.getIdentity();
            this.showMenuIfAuth()
            console.log("authenticated")
            return true;
        } else {
            console.log("not authenticated")
            this.showMenuIfNotAuth()
            return false;
        }
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

    async getIdentity() {
        const identity = await this.authClient.getIdentity();
        return identity;
    }

    async getCanisters(identity) {
        console.log("Get canister for identity", identity.getPrincipal().toString())
        const hackathonActor = hackathon.createActor(hackathon.canisterId, {
            agentOptions: {
                identity,
            },
        })
        const tokenActor = token.createActor(token.canisterId, {
            agentOptions: {
                identity,
            },
        })
        return {hackathon: hackathonActor, token: tokenActor};
    }

    getAnomymousCanisters() {
        const hackathonActor = hackathon.hackathon;
        const tokenActor = token.token;
        return {hackathon: hackathonActor, token: tokenActor};
    }

    async getAnomymousIdentity() {
        this.authClient = await AuthClient.create();
        const identity = await this.authClient.getIdentity();
        return identity;
    }
    
    async logout() {      
        await this.authClient.logout();
        this.showMenuIfNotAuth()
    }
};