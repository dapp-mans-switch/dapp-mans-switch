import D "mo:base/Debug";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

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

    public query func randomNumbers(seed: Text, n: Nat) : async [Nat64] {
        let seeds = RNG.getShaSeeds(seed);
        let rng = RNG.PRNG(seeds.seed0, seeds.seed1);
        Array.tabulate<Nat64>(n, func (i: Nat) : Nat64 { rng.randomNumber() });
    };

    public query func randomNumbersBelow(seed: Text, below: Nat, n: Nat) : async [Nat] {
        let seeds = RNG.getShaSeeds(seed);
        let rng = RNG.PRNG(seeds.seed0, seeds.seed1);
        Array.tabulate<Nat>(n, func (i: Nat) : Nat { rng.randomNumberBelow(below) });
    };

    public query func testRNG(seed: Text, below: Nat, n: Nat): async [Nat] {
        let seeds = RNG.getShaSeeds(seed);
        let rng = RNG.PRNG(seeds.seed0, seeds.seed1);
        let numbers = Array.tabulate<Nat>(n, func (i: Nat) : Nat { rng.randomNumberBelow(below) });
        let counts = Array.init<Nat>(10, 0);
        for (x in numbers.vals()) {
            counts[x] += 1;
        };
        return Array.freeze(counts);
    };

    public query func randomNumber(seed0: Nat64, seed1: Nat64) : async Nat64 {
        let rng = RNG.PRNG(seed0, seed1);
        rng.randomNumber();
    };

    public query func getShaSeeds(seed: Text) : async RNG.Seeds {
        RNG.getShaSeeds(seed);
    };
    

    // Staker
    var stakerManager: Staker.StakerManager = Staker.StakerManager();

    public shared(msg) func registerStaker(public_key: Text): async Bool {
        let staker_id = msg.caller;
        stakerManager.registerStaker(staker_id, public_key);
    };

    // dfx canister call hackathon registerStaker '("Markus", "pubkey", 10, 10)'
    public shared(msg) func addStake(amount: Nat, days: Nat): async Nat {
        let staker_id = msg.caller;
        D.print("staker id " # Principal.toText(staker_id));
        stakerManager.addStake(staker_id, amount, days);
    };

    // dfx canister call hackathon lookupStaker 0
    public query func lookupStake(id: Nat) : async ?Stake {
        stakerManager.lookup(id);
    };

    public func removeStake(id: Nat): async Bool {
        stakerManager.remove(id);
    };

    public shared(msg) func lookupMyPublicKey(): async ?Text {
        let staker_id = msg.caller;
        stakerManager.publicKeyFor(staker_id);
    };

    public query func lookupPublicKey(staker_id: Principal): async ?Text {
        stakerManager.publicKeyFor(staker_id);
    };


    public query func listAllStakes() : async [Stake] {
        stakerManager.listAllStakes();
    };

    public query func listAllStakers() : async [Staker] {
        stakerManager.listAllStakers();
    };


    public query func listStakesOf(staker_id: Principal) : async [Stake] {
        stakerManager.listStakesOf(staker_id);
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
