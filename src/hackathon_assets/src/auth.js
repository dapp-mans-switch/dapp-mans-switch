import { AuthClient } from "@dfinity/auth-client";

import * as hackathon from '../../declarations/hackathon';
import * as token from '../../declarations/token';

import routToPage from './router'


export class Auth {

    constructor () {
        console.log("Auth Constructor")
        this.canistersInitialised = false
    }

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
        if (this.canistersInitialised) {
            console.log("authenticated: canisters intitialised")
        }

        this.authClient = await AuthClient.create();
        if (await this.authClient.isAuthenticated()) {
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
        const loginButton = document.getElementById("loginButton");
        
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

    /*
    async getIdentity() {
        const identity = await this.authClient.getIdentity();
        return identity;
    }*/

    async getCanisters(identity) {
        if (this.cansisters) {
            console.log("return cached canisters")
            return this.cansisters
        }

        //console.log("Get canister for identity", identity.getPrincipal().toString())
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

        this.canistersInitialised = true
        this.canisters = {hackathon: hackathonActor, token: tokenActor};

        return canisters
    }

    async getAnomymousCanisters() {
        if (this.canistersInitialised) {
            return this.cansisters
        }

        const hackathonActor = hackathon.hackathon;
        const tokenActor = token.token;

        this.canistersInitialised = true
        this.canisters = {hackathon: hackathonActor, token: tokenActor};
        console.log("Intitialised canisters in auth")
        return this.canisters
    }

    getProps() {
        return {canisters: this.canisters}
    }

    /*
    async getAnomymousIdentity() {
        this.authClient = await AuthClient.create();
        const identity = await this.authClient.getIdentity();
        return identity;
    }*/
    
    async logout() {      
        await this.authClient.logout();
        this.cansisters = undefined
        this.authClient = undefined
        this.canistersInitialised = false
        this.showMenuIfNotAuth()
    }
};

export const auth = new Auth()