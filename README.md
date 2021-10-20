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


## Authentication

### For local development
Clone [Internet Identity](https://github.com/dfinity/internet-identity).

Make sure you have installed:
- dfx `dfx --version`
- Rust `cargo --version`
- NodeJS `npm --version;  node --version`
- CMake `cmake --version`

```bash
cd ICP-hackathon
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

If you do have errors, delete the `.dfx` folder in both projects and repeat.
```bash
cd internet-identity
rm -rf .dfx/
cd ICP-hackathon
rm -rf .dfx/
```
Also, make sure to `npm install` and to have all dependencies for internet identity installed and execute the calls in the given order.

You can disable authentification in `index.jsx`.
