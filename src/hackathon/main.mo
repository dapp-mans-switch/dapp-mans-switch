import D "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Error "mo:base/Error";

import Secret "./secret";
import Staker "./staker";
import Types "./types";

import SHA "./utils/SHA256";
import RNG "./utils/rng";
import base64 "./utils/base64";
import Demo "./demo_data/demo_data";

import Token "canister:token";

actor Hackathon {
    type Stake = Types.Stake;
    type Staker = Types.Staker;
    type Secret = Types.Secret;
    type RelevantSecret = Types.RelevantSecret;

	// example call to Token canister
	// TODO remove
	public func idk() : async Text {
		let sym = await Token.symbol();
		return sym;
	};

    public query func identity() : async Principal {
		_this();
	};

    private func _this() : Principal {
        Principal.fromActor(Hackathon);
    };

    public shared query (msg) func whoami() : async Principal {
        msg.caller
    };

    public query func sha256(text: Text) : async Text {
        SHA.sha256(text);
    };


    // ---------------------------------------------------------------------------------------------


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
    * Add a stake for staker. Transfers 'amount' $HRBT tokens to this canister.
    * Params:
    *   - amount: the number of tokens to stake
    *   - days: the duration of the stake in days
    * Returns:
    *   AddStakeResult {#ok: Nat, #err: {#unknownStaker: Principal, #invalidDuration: Int}}
    *       stake_id on success
    */
    public shared(msg) func addStake(amount: Nat, days: Nat): async Staker.AddStakeResult {
        let staker_id = msg.caller;
        let r = stakerManager.addStake(staker_id, amount, days);
        switch (r) {
            case (#err(e)) {
                // internal error
                return r;
            };
            case (#ok(stake_id)) {
                // no internal error -> try transfer of tokens
                try {
                    // amount has to be approved and sufficient balance is required
                    let ok = await Token.transferFrom(staker_id, _this(), amount, null);
                    return r;
                } catch(e) {
                    let s = stakerManager.deleteStake(stake_id); // remove added stake
                    return #err(#transferError(Error.message(e)));
                };
            };
        };
    };

    /*
    * Ends stake by setting the expiry_time to now. Gives back tokens depending on end time.
    */
    public shared(msg) func endStake(stake_id: Nat): async Staker.EndStakeResult {
        let balance = await Token.myBalance();
        switch (stakerManager.lookup(stake_id)) {
            case null {
                return #err(#stakeNotFound(stake_id));
            };
            case (? stake) {
                if (balance < stake.amount) {
                    // well sorry, we can't pay you back right now.
                    // if this happens then some corrupt admin withdrawed tokens from this canister
                    return #err(#insufficientFunds("We are sorry that at this point we cannot payout your reward. The stake remains valid. Contact support!"));
                };
            };
        };

        let staker_id = msg.caller;
        let r = stakerManager.endStake(staker_id, stake_id);
        switch (r) {
            case (#err(e)) {
                return r;
            };
            case (#ok(#payout(amount))) {
                // should not throw error, we checked balance above
                let ok = await Token.transfer(staker_id, amount, null);
                return #ok(#payout(amount));
            };
        };

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


    /*
    * Returns the number of stakes which expiry after expiry_time, are valid
    * and don't belong to author_id.
    */
    public shared query (msg) func getAvailableStakes(expiry_time: Int): async Nat {
        let author_id: Principal = msg.caller;
        stakerManager.getAvailableStakes(author_id, expiry_time);
    };

    /*
    * Randomly draws stakes proporitional to their amount, which have to be used
    * for a new secret. Does not draw stakes which belong to the author.
    * Params:
    *   - expiry_time: The desired expiry time of the secret. Only stakes
    *     which are expiry after this time are drawn.
    *   - n: The number of stakes to be drawn.
    * Returns:
    *   On success the drawn stakes.
    *   Retruns an error with the expiry_time if there are no stakes for expiry_time.
    */
    public shared(msg) func drawStakes(expiry_time: Int, n: Nat) : async Staker.DrawStakesResult {
        let author_id = msg.caller;
        let stakes = await stakerManager.drawStakes(author_id, expiry_time, n);
        return stakes;
    };


    // ---------------------------------------------------------------------------------------------


    // Secret


    var secretManager: Secret.SecretManager = Secret.SecretManager();

    /*
    * Returns all secrets.
    */
    public query func listAllSecrets() : async [Secret] {
        secretManager.listAll();
    };

    /*
    * Returns all secret for which were authored by caller.
    */
    public shared query (msg) func listMySecrets() : async [Secret] {
        let author_id = msg.caller;
        secretManager.listSecretsOf(author_id);
    };

    /*
    * Returns all secrets which are authored by caller
    * with additional bool whether reveal process in in progress.
    */
    public shared query (msg) func listMySecretsPlusRevealInfo() : async [(Secret, Bool)] {
        let author_id = msg.caller;
        secretManager.listSecretsPlusInfoOf(author_id);
    };

    /*
    * Returns the all secrets for which were authored by author_id.
    */
    public query func listSecrets(author_id: Principal) : async [Secret] {
        secretManager.listSecretsOf(author_id);
    };

    /*
    * Returns all secret for which caller is a share holder in form of the RelevenatSecret type.
    */
    public shared query (msg) func listRelevantSecrets() : async [RelevantSecret] {
        let staker_id = msg.caller;
        secretManager.listRelevantSecrets(staker_id);
    };

    /*
    * Returns the secret with secret_id for which the caller is a share holder in form of the RelevenatSecret type.
    */
    public shared query (msg) func getRelevantSecret(secret_id: Nat) : async ?RelevantSecret {
        let staker_id = msg.caller;
        secretManager.getRelevantSecret(staker_id, secret_id);
    };

    public type AddSecretError = {
        #invalidStakes: [Nat];
        #invalidReward: Nat;
        #invalidHeartbeatFreq: Int;
        #invalidListLengths: Int;
        #invalidPublicKey: Text;
        #transferError: Text};
    public type AddSecretResult = Result.Result<Secret, AddSecretError>;

    let secretBasePrice: Nat = 10;
    public query func getSecretBasePrice() : async Nat {
        return secretBasePrice;
    };

    /*
    * Adds a secret. Transfers reward + secretBasePrice tokens to this canister.
    * Params:
    *   - payload : Enrypted secret.
    *   - uploader_public_key: Public key of secret encryption.
    *   - reward: TODO maybe remove
    *   - expiry_time: timestamp when secret WILL be revealed (seconds since 1970)
    *   - heartbeat_freq: the frequency with which the author has to send a heartbeat in order
    *       to keep the secret alive (seconds)
    *   - encrypted_shares: encrypted secret shares which will be decrypted by stakers
    *   - decrypted_share_shas: sha256 hashes of the decrypted secret shares to ensure that stakers
    *       upload correct decrypted share
    *   - share_holder_stake_ids: The stake_ids which receive a secret share. This HAVE to be drawn
    *       with drawStakes before calling this method, to ensure that the secret shares are
    *       distributed by the backend.
    * Returns:
    *   On success: the added secret
    *   Various error messages conforming to AddSecretError type.
    */
    public shared(msg) func addSecret(payload: Text, uploader_public_key: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int,
        encrypted_shares: [Text], decrypted_share_shas: [Text], share_holder_stake_ids: [Nat]): async AddSecretResult {
        
        let author_id = msg.caller;
        let ok = stakerManager.verifySelectedStakes(author_id, share_holder_stake_ids);
        if (not ok) {
            return #err(#invalidStakes(share_holder_stake_ids));
        };
        let removed = stakerManager.removeCachedStakes(author_id);

        if (reward == 0) {
            return #err(#invalidReward(reward));
        };
        if (heartbeat_freq < 0) {
            return #err(#invalidHeartbeatFreq(heartbeat_freq));
        };
        if ((encrypted_shares.size() != decrypted_share_shas.size()) or (decrypted_share_shas.size() != share_holder_stake_ids.size())) {
            return #err(#invalidListLengths(encrypted_shares.size()));
        };
        if (not base64.validateBase64(uploader_public_key)) {
            return #err(#invalidPublicKey(uploader_public_key));
        };

        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                try {
                    // amount has to be approved and sufficient balance is required
                    let ok = await Token.transferFrom(author_id, _this(), reward + secretBasePrice, null);
                    
                    let secret = secretManager.insert(
                        author_id, payload, uploader_public_key,
                        reward, expiry_time, heartbeat_freq,
                        encrypted_shares, decrypted_share_shas, share_holder_ids, share_holder_stake_ids);
                    
                    return #ok(secret);

                } catch(e) {
                    return #err(#transferError(Error.message(e)));
                };

            };
            case (#err(#stakeIdNotFound(stake_id))) {
                return #err(#invalidStakes(share_holder_stake_ids));
            };
        };
    };

    /*
    * Returns secret for secret_id if it exists.
    */
    public query func lookupSecret(id: Nat) : async ?Secret {
        secretManager.lookup(id);
    };

    /*
    * Updates the last_heartbeat field to the current time for all secrets of author_id.
    */
    public shared(msg) func sendHeartbeat() : async Bool {
        let author_id = msg.caller;
        secretManager.sendHeartbeat(author_id)
    };

    /*
    * Checks if a secret should be revealed.
    * This is the case if the last heartbeat was too long ago.
    */
    public query func shouldReveal(secret_id: Nat) : async Bool {
        return secretManager.shouldReveal(secret_id);
    };


    /*
    * Reveals all shares for a secret of caller.
    * The shares have to be in correct order. This is guaranteed if the shares are obtained by getRelevantSecret.
    * Too make sure that the stake holder uploads the correct shares, the decrypted shares are compared against
    * the decrypted_share_shas of the secret (created by the secret author).
    * Pays out reward to caller.
    * Params:
    *   secret_id: id of secret
    *   shares: decrypted shares
    */
    public shared(msg) func revealAllShares(secret_id: Nat, shares: [Text]): async Secret.RevealAllSharesResult {
        let staker_id = msg.caller;
        let r = secretManager.revealAllShares(secret_id, staker_id, shares);
        switch (r) {
            case (#err(e)) {
                return r;
            };
            case (#ok(s)) {
                try {
                    let ok = await Token.transfer(staker_id, s.payout, null);
                    return r;
                } catch(e) {
                    // should not happen as author id pays for all payouts
                    // we reveal the secret anyway but don't payout
                    return #err(#insufficientFunds("We are sorry that at this point we cannot payout your reward. The shares are revealed anyways. Contact support!"));
                };
            };
        };
    };

    
    /*
    * If an author of a secret sends all required heartbeat and the secret expires,
    * then stakers can request payout.
    */
    public shared(msg) func requestPayout(secret_id: Nat): async Secret.RequestPayoutResult {
        let staker_id = msg.caller;
        let r = secretManager.requestPayout(secret_id, staker_id);
        switch (r) {
            case (#err(e)) {
                return r;
            };
            case (#ok(payout)) {
                try {
                    let ok = await Token.transfer(staker_id, payout, null);
                    return r;
                } catch(e) {
                    // should not happen as author id pays for all payouts
                    // we reveal the secret anyway but don't payout
                    return #err(#insufficientFunds("We are sorry that at this point we cannot payout your reward. The shares are revealed anyways. Contact support!"));
                };
            };
        };
    };


    // ---------------------------------------------------------------------------------------------

    // TODO: remove
    public shared(msg) func dropTables(): async Bool {
        secretManager.secrets := HashMap.HashMap<Nat, Secret>(0, Nat.equal, Hash.hash);
        stakerManager.stakes := HashMap.HashMap<Nat, Stake>(0, Nat.equal, Hash.hash);
        stakerManager.stakers := HashMap.HashMap<Principal, Text>(0, Principal.equal, Principal.hash);
        true;
    };

    public shared(msg) func changeToDemoData(): async Bool {
        var ok = await dropTables();
        Demo.addStakers(msg.caller, stakerManager.stakers);
        Demo.addStakes(msg.caller, stakerManager.stakes);
        Demo.addSecrets(msg.caller, stakerManager, secretManager.secrets);
        let x = await Token.buyIn(100000); // enough tokens for canister
        ok := await Token.transferFrom(msg.caller, _this(), await Token.balanceOf(msg.caller), null);
        ok := await Token.transfer(msg.caller, 42, null);
        true;
    };

    // System stability

    private stable var _secrets: [(Nat, Secret)] = [];
    private stable var _stakers: [(Principal, Text)] = [];
    private stable var _stakes: [(Nat, Stake)] = [];

    system func preupgrade() {
        _secrets := Iter.toArray(secretManager.secrets.entries());

        _stakers := Iter.toArray(stakerManager.stakers.entries());

        _stakes := Iter.toArray(stakerManager.stakes.entries());
    };

    system func postupgrade() {
        secretManager.secrets := HashMap.fromIter<Nat, Secret>(
            _secrets.vals(),
            0, Nat.equal, Hash.hash
        );
        _secrets := [];


        stakerManager.stakers := HashMap.fromIter<Principal, Text>(
            _stakers.vals(),
            0, Principal.equal, Principal.hash
        );
        _stakers := [];


        stakerManager.stakes := HashMap.fromIter<Nat, Stake>(
            _stakes.vals(),
            0, Nat.equal, Hash.hash
        );
        _stakes := [];
    };
};
