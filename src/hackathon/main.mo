

import Types "./types";
import Staker "./staker";
import Secret "./secret";

import Counter "./counter";

import Principal "mo:base/Principal";

import D "mo:base/Debug";

actor {
    type Staker = Types.Staker;
    type Secret = Types.Secret;

    public func greet(content : Text) : async Text {
        return "New forum post: " # content # "!!!";
    };

    // use msg for authentification like in https://github.com/dfinity/linkedup/blob/master/src/linkedup/main.mo ?
    // see https://sdk.dfinity.org/docs/language-guide/caller-id.html
    public shared(msg) func sharedGreet(content : Text) : async Text {
        return "New forum post: " # content # "!!! from " # Principal.toText(msg.caller);
    };

    public shared(msg) func getCounter(init: Nat) : async Counter.Counter {
        let t = await Counter.Counter(msg.caller, init);
        return t;
    };

    // Staker
    var stakerManager: Staker.StakerManager = Staker.StakerManager();

    // dfx canister call hackathon registerStaker '("Markus", 1234, 10, 10)'
    public shared(msg) func registerStaker(name: Text, public_key: Nat, amount: Nat, days: Nat): async Nat { 
        let id = msg.caller;
        D.print("staker id " # Principal.toText(id));
        stakerManager.insert(id, name, public_key, amount, days);
    };

    public query func lookupStaker(id: Nat) : async ?Staker {
        stakerManager.lookup(id);
    };

    public func removeStaker(id: Nat): async Bool {
        stakerManager.remove(id);
    };

    /*
    public func editStaker(id: Principal, name: Text, amount: Nat, days:Nat) : async Bool {
        stakerManager.edit(id, name, amount, days);
    };*/

    public query func listAllStakers() : async [Staker] {
        stakerManager.listAll();
    };


    // Secret
    var secretManager: Secret.SecretManager = Secret.SecretManager();

    // dfx canister call hackathon addSecret '("secret", 10, 1635724799, 86400, vec {principal "72lwh-lydzc-z7q5x-7z4pd-cy6vi-hsnyv-g42ay-fq5t7-tmyzm-pbubw-uae"; principal "72lwh-lydzc-z7q5x-7z4pd-cy6vi-hsnyv-g42ay-fq5t7-tmyzm-pbubw-uae"})'
    public shared(msg) func addSecret(payload: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, key_holders: [Principal]): async Nat { 
        let author_id = msg.caller; 
        secretManager.insert(author_id, payload, reward, expiry_time, heartbeat_freq, key_holders);
    };

    // dfx canister call hackathon lookupSecret 0
    public query func lookupSecret(id: Nat) : async ?Secret {
        secretManager.lookup(id);
    };

    // dfx canister call hackathon sendHearbeat 0
    public shared(msg) func sendHearbeat(secret_id: Nat) : async Bool {
        let author_id = msg.caller;
        secretManager.sendHearbeat(author_id, secret_id)
    };

    // dfx canister call hackathon shouldReveal 0
    public query func shouldReveal(secret_id: Nat) : async Bool {
        return secretManager.shouldReveal(secret_id);
    };

    // dfx canister call hackathon revealKey '(0,5)'
    public shared(msg) func revealKey(secret_id: Nat, key: Nat, atIndex: Nat): async Bool  {
        let key_holder = msg.caller;
        let payoutAmount = secretManager.revealKey(secret_id, key_holder, key, atIndex);

        switch payoutAmount {
            case null { return false };
            case (? payoutAmount) { 
                return payout(key_holder, payoutAmount);
            };
        };
    };

    private func payout(staker_id: Principal, payout: Int) : Bool {
        // TODO 
        return true;
    }
};
