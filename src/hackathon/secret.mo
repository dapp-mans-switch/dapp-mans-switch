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
import SHA "./sha/SHA256"

module {
    type Secret = Types.Secret;
    type RelevantSecret = Types.RelevantSecret;

    public class SecretManager() {

        let secrets = Map.HashMap<Nat, Secret>(0, Nat.equal, Hash.hash);

        func secondsSince1970() : Int {
            return Time.now() / 1_000_000_000;
        };

        public func insert(author_id: Principal, payload: Text, uploader_public_key: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, encrypted_shares: [Text], decrypted_share_shas: [Text], share_holder_ids: [Principal], share_holder_stake_ids: [Nat]): ?Secret {

            assert (encrypted_shares.size() == share_holder_ids.size());
            // TODO check that author_id != key_holder
            // TODO check that stakes are longer than expiry time

            let secret_id = secrets.size()+1;
            let last_heartbeat = secondsSince1970();
            let revealed = Array.freeze(Array.init<Bool>(share_holder_ids.size(), false));
            let shares = encrypted_shares;
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

                share_holder_ids;
                share_holder_stake_ids;

                shares;
                decrypted_share_shas;
                revealed;

                valid
            };

            secrets.put(secret_id, newSecret);

            return ?newSecret;
        };


        public func lookup(id: Nat) : ?Secret {
            secrets.get(id);
        };

        public func sendHearbeatForSecret(author_id: Principal, secret: Secret) : Bool {
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

                share_holder_ids = secret.share_holder_ids;
                share_holder_stake_ids = secret.share_holder_stake_ids;

                shares = secret.shares;
                decrypted_share_shas = secret.decrypted_share_shas;
                revealed = secret.revealed;

                valid = secret.valid
            };

            secrets.put(secret.secret_id, newSecret);

            return true;
        };

        
        public func sendHeartbeat(author_id: Principal) : Bool{
            var ok: Bool = true;
            let author_secrets = listSecretsOf(author_id);
            for (s in author_secrets.vals()) {
                ok := ok and sendHearbeatForSecret(author_id, s);
            };
            return ok
        };

        public func sendHeartbeatForId(author_id: Principal, secret_id: Nat) : Bool {
            let secret = secrets.get(secret_id);

            switch secret {
                case null { return false };
                case (? secret) {
                    sendHearbeatForSecret(author_id, secret);
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

        // shares have to be in correct order, as obtained by getRelevantSecret
        public func revealAllShares(secret_id: Nat, staker_id: Principal, shares: [Text]) : ?Secret  {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return null };
                case (? secret) {
                    var share_counter: Nat = 0;
                    let _newShares = Array.init<Text>(secret.shares.size(), "");
                    let _newRevealed = Array.init<Bool>(secret.shares.size(), false);

                    for (i in Iter.range(0, _newShares.size()-1)) {
                        //D.print(Nat.toText(i) # " " # Nat.toText(secret.share_holder_ids[i]) # " " # Nat.toText(share_counter));
                        
                        // update all shares for which staker_id has share / stake 
                        if (secret.share_holder_ids[i] == staker_id) {
                            let decryptedShare: Text = shares[share_counter];
                            let decryptedShareSha: Text = SHA.sha256(decryptedShare);
                            assert (decryptedShareSha == secret.decrypted_share_shas[i]); // make sure that staker uploads correct decrypted share
                        
                            _newShares[i] := decryptedShare;
                            _newRevealed[i] := true;
                            share_counter += 1;
                        } else {
                            _newShares[i] := secret.shares[i];
                            _newRevealed[i] := secret.revealed[i]
                        };
                    };
                    assert (share_counter == shares.size()); // all shares have to be revealed

                    let newShares: [Text] = Array.freeze(_newShares);
                    let newRevealed: [Bool] = Array.freeze(_newRevealed);

                    let newSecret = {
                        secret_id = secret.secret_id;
                        author_id = secret.author_id;

                        payload = secret.payload;
                        uploader_public_key = secret.uploader_public_key;
                        reward = secret.reward;

                        expiry_time = secret.expiry_time;
                        last_heartbeat = secret.last_heartbeat;
                        heartbeat_freq = secret.heartbeat_freq;

                        share_holder_ids = secret.share_holder_ids;
                        share_holder_stake_ids = secret.share_holder_stake_ids;

                        shares = newShares; // update
                        decrypted_share_shas = secret.decrypted_share_shas;
                        revealed = newRevealed; // update

                        valid = secret.valid
                    };
                    secrets.put(secret_id, newSecret);

                    return ?newSecret;
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


        private func toRelevantSecret(s: Secret, staker_id: Principal): RelevantSecret {
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

            return relevantSecret;
        };

        public func listRelevantSecrets(staker_id: Principal) : [RelevantSecret] {
            let relevantSecrets = Buffer.Buffer<RelevantSecret>(0);
            for ((id, s) in secrets.entries()) {

                if (Array.find(s.share_holder_ids, func(id:Principal) : Bool { id == staker_id}) != null) {
                    
                    let relevantSecret = toRelevantSecret(s, staker_id);
                    relevantSecrets.add(relevantSecret);
                }
            };
            return relevantSecrets.toArray();
        };

        public func getRelevantSecret(staker_id: Principal, secret_id: Nat): ?RelevantSecret {
            let secret = lookup(secret_id);
            switch (secret) {
                case null { return null };
                case (? s) {
                    let relevantSecret = toRelevantSecret(s, staker_id);
                    return ?relevantSecret;
                };
            };
        };
        
        public func listSecretsOf(author_id: Principal) : [Secret] {
            let allSecrets = Buffer.Buffer<Secret>(0);
            for ((id, s) in secrets.entries()) {
                if (s.author_id == author_id) {   
                    allSecrets.add(s);
                };
            };
            return allSecrets.toArray();
        };
    };
}
