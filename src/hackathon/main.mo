

import Types "./types";
import Staker "./staker";
import Secret "./secret";


actor {
    type Staker = Types.Staker;
    type Secret = Types.Secret;

    public func greet(content : Text) : async Text {
        return "New forum post: " # content # "!!!";
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

    // dfx canister call hackathon addSecret '("secret", 10, 10, 10, vec {1;2}, vec {1;2})'
    public func addSecret(payload: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Nat, key_holders: [Nat], keys: [Nat]): async Nat { 
        let author_id = 0; // TODO: authentification
        secretManager.insert(author_id, payload, reward, expiry_time, heartbeat_freq, key_holders, keys);
    };

    public query func lookupSecret(id: Nat) : async ?Secret {
        secretManager.lookup(id);
    };
};
