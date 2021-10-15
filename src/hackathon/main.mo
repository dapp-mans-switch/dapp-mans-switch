

import Types "./types";
import Staker "./staker";
import Secret "./secret";

import Counter "./counter";

import Principal "mo:base/Principal";

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

    public func addStaker(name: Text, amount: Nat, days:Nat): async Nat { 
        stakerManager.insert(name, amount, days);
    };

    public query func lookupStaker(id: Nat) : async ?Staker {
        stakerManager.lookup(id);
    };

    public func removeStaker(id: Nat): async Bool {
        stakerManager.remove(id);
    };

    public func editStaker(id: Nat, name: Text, amount: Nat, days:Nat) : async Bool {
        stakerManager.edit(id, name, amount, days);
    };

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
    public shared(msg)  func revealKey(secret_id: Nat, key: Nat, atIndex: Nat): async Bool  {
        let key_holder = msg.caller;
        secretManager.revealKey(secret_id, key_holder, key, atIndex);
    };
};
