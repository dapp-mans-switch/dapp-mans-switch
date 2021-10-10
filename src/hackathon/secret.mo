import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Types "./types";

module {
    type Secret = Types.Secret;
    type Staker = Types.Staker;

    public class SecretManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        let secrets = Map.HashMap<Nat, Secret>(0, eq, Hash.hash);


        public func insert(author_id: Nat, payload: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Nat, key_holders: [Nat], keys: [Nat]): Nat {

            let secret_id = secrets.size();
            let last_heartbeat = Time.now();
            let revealed = Array.tabulate<Bool>(key_holders.size(), func(i:Nat) : Bool {false}); //ugly hack Array.init<Bool>(key_holders.size(), false);
            let valid = true;

            let newSecret = {secret_id; author_id; payload; reward; expiry_time; last_heartbeat; heartbeat_freq; key_holders; keys; revealed; valid};
            secrets.put(secret_id, newSecret);
            return secret_id;
        };

        public func lookup(id: Nat) : ?Secret {
            secrets.get(id);
        };


    }
}