# ICP hackathon

## How to run

### locally
* `npm install`
* `dfx start --background`
* `dfx deploy`
* go to localhost:8080

### on chain
Like above, but add `--network ic` right after `dfx deploy`.

## remarks
You need cycles for each deployment, and a LOT for the first deployment in my experience.
There is a faucet for free cycles here: https://faucet.dfinity.org/auth.
However, if we don't want to spend real money we should not use up our cycles for the heck of it; maybe only one person should deploy the project on chain.

See https://sdk.dfinity.org/docs/quickstart/local-quickstart.html for the full tutorial.
