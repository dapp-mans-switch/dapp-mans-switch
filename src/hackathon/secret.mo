import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Types "./types";

import D "mo:base/Debug";

module {
    type Secret = Types.Secret;
    type Staker = Types.Staker;

    public class SecretManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        let secrets = Map.HashMap<Nat, Secret>(0, eq, Hash.hash);

        func secondsSince1970() : Int {
            return Time.now() / 1_000_000_000;
        };

        public func insert(author_id: Nat, payload: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, key_holders: [Nat], keys: [Nat]): Nat {

            let secret_id = secrets.size();
            let last_heartbeat = secondsSince1970();
            let revealed = Array.tabulate<Bool>(key_holders.size(), func(i:Nat) : Bool {false}); //ugly hack Array.init<Bool>(key_holders.size(), false);
            let valid = true;

            let newSecret = {
                secret_id;
                author_id;
                
                payload;
                reward;
                
                expiry_time;
                last_heartbeat;
                heartbeat_freq;
                
                key_holders;
                keys;
                revealed;
                valid
            };

            secrets.put(secret_id, newSecret);

            return secret_id;
        };


        public func lookup(id: Nat) : ?Secret {
            secrets.get(id);
        };

        public func sendHearbeat(author_id: Nat, secret_id: Nat) : Bool {
            let secret = secrets.get(secret_id);

            switch secret {
                case null { return false };
                case (? secret) {
                    // TODO: proper authentification
                    if (author_id != secret.author_id) {
                        return false;
                    };

                    let heartbeat = secondsSince1970();

                    // TODO: no better way?
                    let newSecret = {
                        secret_id = secret.secret_id;
                        author_id = secret.author_id;
                        
                        payload = secret.payload;
                        reward = secret.reward;
                        
                        expiry_time = secret.expiry_time;
                        last_heartbeat = heartbeat; // update heartbeat
                        heartbeat_freq = secret.heartbeat_freq;
                        
                        key_holders = secret.key_holders;
                        keys = secret.keys;
                        revealed = secret.revealed;
                        valid = secret.valid
                    };

                    secrets.put(secret_id, newSecret);

                    return true;
                };
            };
        };

        public func shouldReveal(secret_id: Nat) : Bool {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return false };
                case (? secret) {
                    let now = secondsSince1970();
                    // either secret has expired or last heartbeat is too long ago
                    let revealOk: Bool = (now > secret.expiry_time) or (now - secret.last_heartbeat > secret.heartbeat_freq);
                    return revealOk;
                };
            };
            
        };

        public func revealKey(secret_id: Nat, key_holder: Nat, key: Nat) : Bool {
            let secret = secrets.get(secret_id);
             switch secret {
                case null { return false };
                case (? secret) {

                    // check if key_holder is indeed holder for secret and get his index in list
                    var match: Bool = false;
                    var index: Nat = 0;
                    label kh for (other_key_holder in secret.key_holders.vals()) {
                        if (key_holder == other_key_holder) {
                            match := true;
                            break kh;
                        };
                        index += 1;
                    };

                    if (not match) {
                        D.print("No match");
                        return false;
                    };
                    D.print("Index: " # Nat.toText(index));

                    
                    let revealOk = shouldReveal(secret_id);
            
                    var payout: Int = 0;
                    if revealOk {
                        payout := 10; // TODO
                    } else {
                        payout := -10; // TODO
                    };

                    // TODO: update keys and revealed at index

                    return true;
                };
            };
        };

    }
}