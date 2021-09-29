# roles

- User (uploads a secret)
- Staker (has X tokens staked)

# upload of a secret

### U generates the following things (LOCALLY):
* a secret S the user wants to upload
* time T the secret should not be made public
* a fresh keypair pub_key, priv_key
* 1000 secret shares of the priv_key
* encrypts S with pub_key = ctxt(S)

### U gets from the backend (ON CHAIN):
* ready list of 1000 randomly selected stakers
    - stakers are chosen proportionally to their stake
    - stakers "promise" to be online for time >= T)
* the 1000 public keys of the stakers

### U encrypts the secret shares with the public keys of the 1000 selected stakers (LOCALLY)

### U uploads the following things onto the IC:
* 1000 encrypted secret shares
* time T
* ctxt(S)
* some amount of tokens to cover the costs & reward that will be distributed after time T




