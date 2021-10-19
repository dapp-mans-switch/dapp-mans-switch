import Array "mo:base/Array";
import D "mo:base/Debug";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";

import Types "./types";

module {
    type Secret = Types.Secret;
    type RelevantSecret = Types.RelevantSecret;
    type Staker = Types.Staker;

    public class SecretManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        let secrets = Map.HashMap<Nat, Secret>(0, eq, Hash.hash);

        func secondsSince1970() : Int {
            return Time.now() / 1_000_000_000;
        };

        public func insert(author_id: Principal, payload: Text, uploader_public_key: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, encrypted_shares: [Text], key_holders: [Principal], share_holder_ids: [Nat]): Nat {

            assert (encrypted_shares.size() == share_holder_ids.size());

            let secret_id = secrets.size();
            let last_heartbeat = secondsSince1970();
            let revealed = Array.freeze(Array.init<Bool>(key_holders.size(), false));
            let shares = encrypted_shares;//Array.tabulate<Text>(key_holders.size(), func(i:Nat) : Text {"nokey"});
            let valid = true;

            let newSecret = {
                secret_id;
                author_id;

                payload;
                uploader_public_key;
                reward;

                expiry_time;
                last_heartbeat;
                heartbeat_freq;

                key_holders;
                share_holder_ids;
                shares;
                revealed;
                valid
            };

            secrets.put(secret_id, newSecret);

            return secret_id;
        };


        public func lookup(id: Nat) : ?Secret {
            secrets.get(id);
        };

        public func sendHearbeat(author_id: Principal, secret_id: Nat) : Bool {
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
                        uploader_public_key = secret.uploader_public_key;
                        reward = secret.reward;

                        expiry_time = secret.expiry_time;
                        last_heartbeat = heartbeat; // update heartbeat
                        heartbeat_freq = secret.heartbeat_freq;

                        key_holders = secret.key_holders;
                        share_holder_ids = secret.share_holder_ids;
                        shares = secret.shares;
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
                    return shouldRevealSecret(secret);
                };
            };

        };

        public func shouldRevealSecret(secret: Secret) : Bool {
            let now = secondsSince1970();
            // either secret has expired or last heartbeat is too long ago
            let revealOk: Bool = (now > secret.expiry_time) or (now - secret.last_heartbeat > secret.heartbeat_freq);
            return revealOk;
        };

        public func revealAllShares(secret_id: Nat, key_holder: Principal, staker_id: Nat, shares: [Text]) : Bool  {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return false };
                case (? secret) {
                    // check if key_holder is indeed holder for secret
                    // assert(secret.key_holders[atIndex] == key_holder);

                    var share_counter: Nat = 0;
                    let _newShares = Array.init<Text>(secret.shares.size(), "");
                    for (i in Iter.range(0, _newShares.size()-1)) {
                        //D.print(Nat.toText(i) # " " # Nat.toText(secret.share_holder_ids[i]) # " " # Nat.toText(share_counter));
                        if (secret.share_holder_ids[i] == staker_id) {
                            _newShares[i] := shares[share_counter];
                            share_counter += 1;
                        } else {
                            _newShares[i] := secret.shares[i];
                        };
                    };
                    assert (share_counter == shares.size()); // all shares have to be revealed

                    let newShares: [Text] = Array.freeze(_newShares);

                    let newRevealed: [Bool] = Array.tabulate<Bool>(secret.revealed.size(), func(i: Nat) : Bool {
                        if ( secret.share_holder_ids[i] == staker_id ) { true } else { secret.revealed[i] }
                    });

                    let newSecret = {
                        secret_id = secret.secret_id;
                        author_id = secret.author_id;

                        payload = secret.payload;
                        uploader_public_key = secret.uploader_public_key;
                        reward = secret.reward;

                        expiry_time = secret.expiry_time;
                        last_heartbeat = secret.last_heartbeat;
                        heartbeat_freq = secret.heartbeat_freq;

                        key_holders = secret.key_holders;
                        share_holder_ids = secret.share_holder_ids;
                        shares = newShares; // update
                        revealed = newRevealed; // update
                        valid = secret.valid
                    };
                    secrets.put(secret_id, newSecret);

                    return true;
                };
            };
        };

        public func listAll() : [Secret] {
            let allSecrets = Buffer.Buffer<Secret>(0);
            for ((id, s) in secrets.entries()) {
                allSecrets.add(s);
            };
            return allSecrets.toArray();
        };



        public func listRelevantSecrets(staker_id: Nat) : [RelevantSecret] {
            let relevantSecrets = Buffer.Buffer<RelevantSecret>(0);
            for ((id, s) in secrets.entries()) {

                if (Array.find(s.share_holder_ids, func(id:Nat) : Bool { id == staker_id}) != null) {
                    
                    let shouldReveal = shouldRevealSecret(s);
                    var hasRevealed = false;

                    let relevantShares = Buffer.Buffer<Text>(s.shares.size());
                    for (i in Iter.range(0, s.shares.size()-1)) {
                        if (s.share_holder_ids[i] == staker_id) {
                            relevantShares.add(s.shares[i]);
                            hasRevealed := s.revealed[i]; // have all the same boolean for same staker_id
                        };
                    };

                    let relevantSecret = {
                        secret_id = s.secret_id;
                        uploader_public_key = s.uploader_public_key;
                        relevantShares = relevantShares.toArray();
                        shouldReveal = shouldReveal;
                        hasRevealed = hasRevealed;
                    };

                    relevantSecrets.add(relevantSecret);
                }
            };
            return relevantSecrets.toArray();
        };
    }
}
