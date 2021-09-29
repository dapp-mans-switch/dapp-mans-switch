# Objects

----------------------
Secret

- `int: total_reward_tokens`
- `time: expiry_time`
- `bool: valid`
- `[Staker]: stakers_who_received_share`
----------------------

----------------------
Staker

- `int: pub_key` 
- `array<(int, time)>: [(enc_secret_share, opening_time)]`
- `int: amount_staked`
- `time: staker_until`
- `bool: wants_to_receive_new_shares`
----------------------

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
* `expiry_time` T (maybe between 1 day and 1 year)
* ctxt(S)
* some amount of tokens to cover the costs & reward that will be distributed after time T

# staking, staking rewards and burning of staked tokens

A wallet holding X tokens can go to the webpage and klick a button, specify `staker_until` and `amount_staked`. `can_receive_new_shares` is set to `True`.
This Staker will only be eligible for receiving shares that expire `<= staker_until`.
This Staker continously receives X tokens from the users who uploaded a secret and received a share of that secret.
This Staker, once the time of a share came to open it, has Y hours (maybe 24) to use the webpage and click "reveal and upload secret share". 
If he does so, he receives his share of the reward for unlocking the secret. If opens and publishes the shared secret not within the timeframe, his staked X tokens will be burned (or redistributed among honest responsible stakers for that secret?).


# tokenomics

* Fixed supply of 10,000,000,000 tokens.
* Initially, we own all the tokens :-) TODO
* If you have tokens, you can stake them and get rewarded for your honesty and work of opening and publishing secrets at the right time.

## upload of a secret
* ON CHAIN 1,000 tokens (let's reffer to them as lottery winners) are selected per upload of a secret at random
* the owners of these lottery winner tokens receive one secret share of the uploaded secret's decryption key

* 50% of the `total_reward_tokens` are distributed among the *honest* lottery winner token holders at after the expiry time of the secret.
We call a lottery winner token holder honest if he follows the protocol.
* the other 50% of the `total_reward_tokens` are continuously (say every day) paid proportionally among all the honest lottery winner token holders.

### example
* suppose a secret with expiry in 50 days and `total_reward_tokens = 100,000` has been uploaded. (lets assume daily payout)
* 1st half: each lottery winner token's wallet gets $50,000/1,000/50 = 1$ tokens per day. If one wallet happens to hold 10 such lucky tokens, it gets 10 tokens per day.
* 2nd half: after the expiry time of the uploaded secret, if the holder of that lucky token opens and publishes his secret share in the required timeframe, he receives $50,000/1,000 = 50$ tokens.
