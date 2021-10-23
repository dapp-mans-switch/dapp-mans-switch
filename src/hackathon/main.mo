import D "mo:base/Debug";
import Principal "mo:base/Principal";

import Secret "./secret";
import Staker "./staker";
import Types "./types";

import SHA "./utils/SHA256";
import RNG "./utils/rng";

actor {
    type Stake = Types.Stake;
    type Staker = Types.Staker;
    type Secret = Types.Secret;
    type RelevantSecret = Types.RelevantSecret;

    public shared (msg) func whoami() : async Principal {
        msg.caller
    };

    public func greet(content : Text) : async Text {
        return "New forum post: " # content # "!!!";
    };

    public shared(msg) func sharedGreet(content : Text) : async Text {
        return "New forum post: " # content # "!!! from " # Principal.toText(msg.caller);
    };


    public query func sha256(text: Text) : async Text {
        SHA.sha256(text);
    };

    // Staker
    var stakerManager: Staker.StakerManager = Staker.StakerManager();

    /*
    * Register a staker with his principal caller id.
    * Params:
    *   - public_key: public key of staker. Should be a base 64 string
            Secret shares are encrypted with this key and the staker should be able to
            decrypt them with his private key.
    * Returns:
    *   RegisterStakerResult {#ok: Text, #err: {#alreadyRegistered; #invalidKey}}
    */
    public shared(msg) func registerStaker(public_key: Text): async Staker.RegisterStakerResult {
        let staker_id = msg.caller;
        stakerManager.registerStaker(staker_id, public_key);
    };

    /*
    * Checks if a caller is a registered staker.
    */
    public shared query (msg) func isRegistered(): async Bool {
        let staker_id = msg.caller;
        stakerManager.isRegistered(staker_id);
    };

    /*
    * Add a stake for staker.
    * Params:
    *   - amount: the number of tokens to stake
    *   - days: the duration of the stake in days
    * Returns:
    *   AddStakeResult {#ok: Nat, #err: {#unknownStaker: Principal, #invalidDuration: Int}}
    *       stake_id on success
    */
    public shared(msg) func addStake(amount: Nat, days: Nat): async Staker.AddStakeResult {
        let staker_id = msg.caller;
        stakerManager.addStake(staker_id, amount, days);
    };

    /*
    * Returns stake for stake id if there is a matching stake.
    */
    public query func lookupStake(id: Nat) : async ?Stake {
        stakerManager.lookup(id);
    };

    /*  
    * Returns the public key for the caller, if the staker is in the system
    */
    public shared query (msg) func lookupMyPublicKey(): async ?Text {
        let staker_id = msg.caller;
        stakerManager.publicKeyFor(staker_id);
    };

    /*  
    * Returns the public key for a staker id, if the staker is in the system
    */
    public query func lookupPublicKey(staker_id: Principal): async ?Text {
        stakerManager.publicKeyFor(staker_id);
    };

    /*
    * Returns all stakes.
    */
    public query func listAllStakes() : async [Stake] {
        stakerManager.listAllStakes();
    };

    /*
    * Returns stakes of staker with staker_id.
    */
    public query func listStakesOf(staker_id: Principal) : async [Stake] {
        stakerManager.listStakesOf(staker_id);
    };

    /*
    * Returns stakes of caller.
    */
    public shared query (msg) func listMyStakes() : async [Stake] {
        let staker_id = msg.caller;
        stakerManager.listStakesOf(staker_id);
    };

    /*
    * Returns all stakers.
    */
    public query func listAllStakers() : async [Staker] {
        stakerManager.listAllStakers();
    };

    public shared(msg) func drawStakes(expiry_time: Int, n: Nat) : async [Stake] {
        let author_id = msg.caller;
        let stakes = await stakerManager.drawStakes(author_id, expiry_time, n);
        return stakes;
    };

    // Secret
    var secretManager: Secret.SecretManager = Secret.SecretManager();

    public query func listAllSecrets() : async [Secret] {
        secretManager.listAll();
    };

    public query func listRelevantSecrets(staker_id: Principal) : async [RelevantSecret] {
        secretManager.listRelevantSecrets(staker_id);
    };

    public query func getRelevantSecret(staker_id: Principal, secret_id: Nat) : async ?RelevantSecret {
        secretManager.getRelevantSecret(staker_id, secret_id);
    };

    public shared(msg) func listMySecrets() : async [Secret] {
        let author_id = msg.caller;
        secretManager.listSecretsOf(author_id);
    };

    public query func listSecrets(author_id: Principal) : async [Secret] {
        secretManager.listSecretsOf(author_id);
    };


    public shared(msg) func addSecret(payload: Text, uploader_public_key: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, encrypted_shares: [Text], decrypted_share_shas: [Text], share_holder_ids: [Principal], share_holder_stake_ids: [Nat]): async ?Secret {
        let author_id = msg.caller;
        let ok = stakerManager.verifySelectedStakes(author_id, share_holder_stake_ids);
        let removed = stakerManager.removeCachedStakes(author_id);

        if (not ok) {
            // error invalid stakes uploaded (not those which were last drawn from author_id)
            return null;
        };
        secretManager.insert(author_id, payload, uploader_public_key, reward, expiry_time, heartbeat_freq, encrypted_shares, decrypted_share_shas, share_holder_ids, share_holder_stake_ids);
    };

    // dfx canister call hackathon lookupSecret 0
    public query func lookupSecret(id: Nat) : async ?Secret {
        secretManager.lookup(id);
    };

    // dfx canister call hackathon sendHearbeat 0
    public shared(msg) func sendHearbeatForId(secret_id: Nat) : async Bool {
        let author_id = msg.caller;
        secretManager.sendHeartbeatForId(author_id, secret_id)
    };

    public shared(msg) func sendHeartbeat() : async Bool {
        let author_id = msg.caller;
        secretManager.sendHeartbeat(author_id)
    };

    // dfx canister call hackathon shouldReveal 0
    public query func shouldReveal(secret_id: Nat) : async Bool {
        return secretManager.shouldReveal(secret_id);
    };

    public shared(msg) func revealAllShares(secret_id: Nat, shares: [Text]): async ?Secret {
        let staker_id = msg.caller;

        secretManager.revealAllShares(secret_id, staker_id, shares);
    };

    private func payout(staker_id: Principal, payout: Int) : Bool {
        // TODO
        return true;
    };
};
