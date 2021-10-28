# ICP hackathon: Dead man's switch

A decentralised dead man's switch on the [Internet Computer](https://dfinity.org).

Built in the course of [Dfinity's Reimangining the Internet Hackathon](https://medium.com/dfinity/announcing-the-reimagining-the-internet-hackathon-for-european-students-and-developers-9f5c1950502f).

## How it works

A dead man's switch (see alternative names) is a switch that is designed to be activated or deactivated if the human operator becomes incapacitated, such as through death, loss of consciousness, or being bodily removed from control [[1]](https://en.wikipedia.org/wiki/Dead_man%27s_switch).

This work brings the concept of a dead man's switch to the Internet Computer.

Let's say Alice is a journalist with sensitive information and there is a group of people who do not want this secret to be published and would even go as far as hurting Alice.
Therefore, she decides to upload this information with our  application to the Internet Computer, where it is guaranteed to be revealed through *inaction* of Alice.
This means that her adversaries cannot incapacitate her without having the secret revealed, also.

From a technical standpoint, Alice generates a cryptographic key-pair with which she encrypts her information.
Her private key will be split up with the power of Shamir's Secret Sharing [[2]](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing) and distributed among users of the application, one of which is called Bob.

First and foremost, Bob is interested in money. He finds the concept of this application compelling and sees value in its token, $HRBT.
He buys $HRBT tokens and volunarily locks them up for a set amount of time. This process is called staking. His commitment signals Alice that he is long enough around to keep her information save. Therefore, Alice gives him a key-share.

Alice decides that it is sufficient to prove her well-being once a day.
If she fails to send this *heartbeat* then Bob knows that something is up, and reveals his key-share.
He receives a reward in $HRBT for his action.
Once the majority of key-share holders have revealed their part of the private key, the secret information is decrypted and visible to everyone.

Key-shares are distributed among users proportionately to their stake.
Atleast 51% of key-share holders have to conspire to circumvent the system, and to be able to decrypt a secret.
This makes our system *proof of stake*.

The Internet Computer makes it possible that the above process is run in a completely decentralised and tamper proof manner.



## Methods

- Users are authenticated with their [Internet Identity](https://identity.ic0.app).
- Multi-canister application
- [ERC20](https://github.com/flyq/motoko_token) compliant token canister
- Random distribution of key-shares with [cryptographic entropy source](https://sdk.dfinity.org/docs/base-libraries/random), combined with a PRNG for performance
- React Front-End
- Motoko Back-End

## Technical Details

## Demo Mode

Only possible in local development.

Make sure to follow the instructions in the *How to run* chapter and set `LOCAL_CANISTER_ID` in `src/hackathon/main.mo` to corresponding the local canister id.
You can look this id up from the output of `dfx deploy` (if you have changed `LOCAL_CANISTER_ID`, run `dfx deploy` again).
If you have troubles with the local authentication setup, or don't care to set it up, you can disable authentication in the front-end code, see below.

Once you have the website running, authenticate yourself (ignore if you have disabled authentication).
You should be able to navigate to the `STAKER` and `UPLOADER` page.
On the start page there is a demo button.
Clicking it will populate the application with demo data.
Wait for the page to refresh.

### Wallet

For demo purposes you can give yourself unlimited $HRBT tokens by clicking `Top Up` on the wallet panel.


## How to run

### Locally
* `npm install`
* `dfx start --background`
* `dfx deploy`
* `npm start`
* go to localhost:8080


### Authentication For Local Development

Clone [Internet Identity](https://github.com/dfinity/internet-identity).

Make sure you have installed:
- dfx `dfx --version`
- Rust `cargo --version`
- NodeJS `npm --version;  node --version`
- CMake `cmake --version`

```bash
cd ICP-hackathon
rm -rf .dfx
npm install
dfx start --clean
dfx deploy
```

```bash
cd internet-identity
rm -rf .dfx
npm install
II_ENV=development dfx deploy --no-wallet --argument '(null)'
```

If you have no error, then make sure that `LOCAL_II_CANISTER` matches the internet identity canister in `webpack.config.js` and start the local development server,
```bash
cd ICP-hackathon
npm start
```

If you do have errors, delete the `.dfx` folder and node modules in both projects and repeat.
```bash
cd internet-identity
rm -rf .dfx/
rm -rf node_modules/
rm package-lock.json

cd ICP-hackathon
rm -rf .dfx/
rm -rf node_modules/
rm package-lock.json
```
Also, make sure to `npm install` and to have all dependencies for internet identity installed and execute the calls in the given order.

### Disable Authentication

In `src/hackathon_assets/index.jsx` you can toggle authentication in the `React.useEffect` method.

```js
// uncomment next line to use with auth
await auth.auth(); await auth.getCanisters()

// uncomment next line to use without auth
await auth.getAnomymousCanisters()
```


### On chain
Like above, but add `--network ic` right after `dfx deploy`.

