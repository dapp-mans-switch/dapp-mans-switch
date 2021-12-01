# dApp Man's Switch

https://izxpb-2iaaa-aaaai-qasea-cai.raw.ic0.app/

A decentralised dead man's switch on the [Internet Computer](https://dfinity.org).

Built in the course of [Dfinity's Reimangining the Internet Hackathon](https://medium.com/dfinity/announcing-the-reimagining-the-internet-hackathon-for-european-students-and-developers-9f5c1950502f).

[First place winners](https://twitter.com/encodeclub/status/1463243417530601475) 🏆🥇.

---

1. [What's a Dead Man's Switch?](#whats-a-dead-mans-switch)
1. [How It Works](#how-it-works)
1. [Methods](#methods)
1. [Technical Details](#technical-details)
1. [The Risks of Centralization](#the-risks-of-centralization)
1. [Demo Mode](#demo-mode)
1. [How to Run](#how-to-run)

---


## What's a Dead Man's Switch?

The basic concept of a dead man's switch is that an event is triggered once a subject fails to prove that they are alive.
In our case users can upload secrets and have to regularly prove that they are still alive, otherwise their secrets will be published.


## How It Works

Let's say Alice is a journalist with sensitive information and there is a group of people who do not want it to be published, and would even go as far as hurting Alice.
Therefore, she decides to upload this information to the Internet Computer through our application, where it is guaranteed to be revealed through *inaction* of Alice.
This means that her adversaries cannot incapacitate her without also having the secret revealed.

From a technical standpoint, Alice generates a cryptographic key-pair with which she encrypts her information.
Her private key will be split up with the power of Shamir's Secret Sharing and distributed among users of the application, one of which is called Bob.

First and foremost, Bob is interested in money.
He finds the concept of this application compelling and sees value in its token, $HRBT.
He buys $HRBT tokens and voluntarily locks them up for a set amount of time.
This process is called staking.
His commitment signals Alice that he is long enough around to keep her information safe.
Therefore, Alice gives him a key-share.

Alice decides that it is sufficient to prove her well-being once a day.
If she fails to send this *heartbeat* then Bob knows that something is up, and reveals his key-share.
He receives a reward in $HRBT for his action.
Once the majority of key-share holders have revealed their part of the private key, the secret information is decrypted and visible to everyone.

Key-shares are distributed among users proportionately to their stake.
At least 51% of key-share holders have to conspire to circumvent the system, and to be able to decrypt a secret.
This makes our system *proof of stake*.

The Internet Computer makes it possible that the above process is run in a completely decentralised and tamper proof manner.


## Methods

- [Motoko](https://smartcontracts.org/docs/language-guide/motoko.html) Back-End
- Multi-canister application
- Users are authenticated with their [Internet Identity](https://identity.ic0.app).
- Asymmetric crypto with [TweetNaCl](https://tweetnacl.js.org)'s Curve25519-XSalsa20-Poly1305
- [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir's_Secret_Sharing) with [shamir](https://npm.io/package/shamir)
- Random distribution of key-shares with [cryptographic entropy source](https://sdk.dfinity.org/docs/base-libraries/random), combined with a PRNG for performance
- [ERC20](https://github.com/flyq/motoko_token) compliant token canister
- [React](https://reactjs.org) Front-End


## Technical Details

The $HRBT token is managed by an independent canister and is ERC20 compliant.
Its implementation is adapted from [flyq](https://github.com/flyq/motoko_token).
In the future users will be able to exchange $HRBT for cycles, ICP, or any common crypto currency.
You can find its source code at [`src/token`](./src/token).
Users are authenticated by their [Internet Identity](https://identity.ic0.app) and the tokens are stored at their principal.

If users want to participate as stakers in order to receive rewards, a cryptographic key-pair is generated locally at their device as they registers.
The public key is shared and used to encrypt key-shares, while the private key is to be stored securely and is used to decrypt and reveal the key-shares.
This makes sure that users can only decrypt and read the key-shares which belong to them.

In order to receive key-shares and rewards, users have to stake their tokens.
In this process, a custom amount of tokens are temporarily transferred to the wallet of the main canister, implemented in [`src/hackathon`](./src/hackathon).
Of course, the tokens are transferred back when the users end their stakes.
If they decide to end their stakes early, they will only get back half of their staked tokens.
All active stakes are in the pool to receive key-shares.
Stakes are managed in [`src/hackathon/staker.mo`](./src/hackathon/staker.mo).

If users want to upload a secret, they can specify a reward, heartbeat frequency, and expiry date.
Locally at their device, a cryptographic key-pair is generated which is used to encrypt the secret.
The private-key is split by the means of Shamir's Secret Sharing.
More than half of the shares are required to reconstruct the private-key and consequently to decrypt the secret.
A higher reward means more shares are generated, currently up to 255.

The main canister is called to draw stakes which receive a key-share (see [`src/hackathon/staker.mo drawStakes`](./src/hackathon/staker.mo#L299)).
Only stakes which expire *after* the secret's expiry data are considered in the raffle.
This guarantees that the key-share holders are long enough around to reveal their share if necessary.

In the lottery, stakes are chosen proportionately to their stake amount at random.
Basis for that is a Pseudo-Random-Number-Generator (implemented in [`src/hackathon/utils/rng.mo`](./src/hackathon/utils/rng.mo)) for efficient sampling.
The seed for this procedure is derived from the cryptographic entropy source provided by the Internet Computer (see [`Random.blob()`](https://github.com/dfinity/motoko-base/blob/master/src/Random.mo)) to ensure a tamper proof distribution of key-shares.
The uploaders can only select the stakes drawn by the main canister.
This makes sure that distribution of key-shares is fair and cannot be influenced by the uploaders.

Once the uploaders know which stakes and stakers receive a key-share, they encrypt the shares with the public key of the stakers.
Furthermore, they create a SHA256 hash from the *decrypted* key-shares.
This hash is used to verify that the stakers indeed reveal the correct decrypted key-shares when needed.
A staker cannot just upload something random and receive a reward.

Once the uploaders have uploaded their secret (managed in [`src/hackathon/secret.mo`](./src/hackathon/secret.mo)), they have to prove that they are alive in intervals specified by the heartbeat frequency.
If they fail to do so, then this signals the stakers that it is time to decrypt their key-shares with their private key and upload them.
The main canister only allows to upload decrypted key-shares, if it conforms to the described protocol.
For their action, stakers are rewarded proportionately to their amount of managed key-shares.
If the uploaders prove their liveliness until the set expiry time, the secret remains encrypted and stakers also receive their payout.


## The Risks of Centralization

Implementing a centralized dead man's switch is trivial, however this centralization opens the door to several major problems that defeat the purpose of the service, namely, the centralized entity can
* inspect the secrets at any time
* publish them early
* withhold them entirely
* be shut down by government or other adversaries.

These issues are all solved with decentralization, Shamir's Secret Sharing, and incentivised unlocking.


## Demo Mode

Only possible in local development.

NOTE: You will have the best experience using a Chromium-based browser, such as [Brave](https://brave.com), [ungoogled-chromium](https://github.com/Eloston/ungoogled-chromium) or Chromium.
<sup><sub>Chrome is also a Chromium-based browser but it's in your best interest not to use it.</sub></sup>

Make sure to follow the instructions in the *How to run* chapter and set `LOCAL_CANISTER_ID` in `src/hackathon/main.mo` to the corresponding local canister id.
You can look this id up in the output of `dfx deploy` (if you have changed `LOCAL_CANISTER_ID`, run `dfx deploy` again).
If you have troubles with the local authentication setup, or don't care to set it up, you can disable authentication, see [below](#disable-authentication).

Once you have the website running, authenticate yourself (ignore if you have disabled authentication).
You should be able to navigate to the `STAKER` and `UPLOADER` page.
On the start page there is a demo button.
Clicking it will populate the application with demo data.
Wait for the page to refresh.

### Wallet

For demo purposes you can give yourself unlimited $HRBT tokens by clicking `Top Up` on the wallet panel.

### Uploader

On the uploader page, you can see in the `My Secrets` table that you have 5 secrets.
Secret 9 is in the process of being revealed, secret 8 already expired and will not be decrypted.
The rest of the secrets are still alive.

In particular, notice secret 11.
Your last heartbeat expires soon. If you do nothing its state will soon change to `Reveal in Progress`.

To avoid that you can click on the `EVERYBODY STAY CALM! I'M STILL ALIVE!` button.
This will update the heartbeats.
Note that secret 11 also expires soon.
So if you have sent a heartbeat its state will change to `Expired`.

On the bottom of the page, you can create new secrets.
Make sure you have enough tokens.

### Staker

On the staker page, you can see in the `My Stakes` table that you currently have 4 stakes.
One already ended, another one is expired and you can end it and get all your tokens back.
The other two are not expired and you will not get back all your tokens back if you end them.

You can create new stakes in the form on the top of the page.
Make sure you have enough tokens.

In the `My Key-Shares` table, you have an overview of all secrets where you received a key-share.
The status indicates that for secret 5 the author is still alive and no action is needed and that for secret 6 you already received your payout.

However, secret 3 and 4 need your attention.
Secret 4 expired so you are not required to reveal your share.
You can simply request your payout and receive tokens.
For secret 5 the author sadly could not send the heartbeat in time.
It is your job to reveal the key-share now.
Click on the reveal button and input the private key `oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==`.
This key only works in demo mode.
Normally you would get a private key when you register as staker.

### Spectator

In the spectator tab you have an overview of all secrets in the system and their current state.

### Start again

If you want to start again with the demo data simply click the demo button again.


## How to Run

### Locally
* `npm install`
* `dfx start --background`
* `dfx deploy`
* `npm start`
* go to localhost:8080

### Disable Authentication

In `webpack.config.js` you can toggle authentication by setting

```js
const AUTHENTICATION = false;
```
You have to run `npm start` again.

### Authentication For Local Development

Clone [Internet Identity](https://github.com/dfinity/internet-identity).

Make sure you have installed:
- dfx `dfx --version`
- Rust `cargo --version`
- NodeJS `npm --version;  node --version`
- CMake `cmake --version`

```bash
cd ICP-hackathon
rm -rf .dfx/ # if you have errors
npm install
dfx start --clean
dfx deploy
```

```bash
cd internet-identity
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


### On chain
* `npm install`
* `dfx start --background`
* `dfx deploy --network ic`

---

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
