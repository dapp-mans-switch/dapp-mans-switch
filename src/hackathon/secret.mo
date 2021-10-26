import Array "mo:base/Array";
import D "mo:base/Debug";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

import Types "./types";
import SHA "./utils/SHA256";
import Date "./utils/date";

module {
    type Secret = Types.Secret;
    type RelevantSecret = Types.RelevantSecret;

    public type RevealAllSharesError = {
        #secretNotFound: Nat;
        #invalidDecryptedSHA: Text;
        #wrongNumberOfShares: Nat;
        #alreadyRevealed: Nat;
        #insufficientFunds: Text;
        #shouldNotReveal: Int;
        #tooLate: Secret;
        #secretExpired: Int;
    };
    public type RevealAllSharesSuccess = {secret: Secret; payout: Nat};
    public type RevealAllSharesResult = Result.Result<RevealAllSharesSuccess, RevealAllSharesError>;
    
    public type RequestPayoutError = {#alreadyPayedOut: Nat; #shouldReveal: Secret; #secretNotFound: Nat; #insufficientFunds: Text};
    public type RequestPayoutResult = Result.Result<Nat, RequestPayoutError>;

    public class SecretManager() {

        public var secrets = Map.HashMap<Nat, Secret>(0, Nat.equal, Hash.hash);

        /*
        * Inserts a secret. 
        * For more information see main.io addSecret
        */
        public func insert(author_id: Principal, payload: Text, uploader_public_key: Text, reward: Nat, expiry_time: Int, heartbeat_freq: Int, encrypted_shares: [Text], decrypted_share_shas: [Text], share_holder_ids: [Principal], share_holder_stake_ids: [Nat]): Secret {

            let secret_id = secrets.size()+1;
            let last_heartbeat = Date.secondsSince1970();
            let revealed = Array.freeze(Array.init<Bool>(share_holder_ids.size(), false));
            let shares = encrypted_shares;

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
            };

            secrets.put(secret_id, newSecret);

            return newSecret;
        };

        /*
        * Deletes secret with secret_id. Just for internal use.
        */
        public func delete(secret_id: Nat): ?Secret {
            secrets.remove(secret_id);
        };


        /*
        * Returns secret for secret_id if it exists.
        */
        public func lookup(id: Nat) : ?Secret {
            secrets.get(id);
        };

        /*
        * Updates the last_heartbeat field of the secret to the current time.
        * If the secret is expired the last_heartbeat field is updated to the expiry_time
        */
        public func sendHearbeatForSecret(author_id: Principal, secret: Secret) : Bool {
            assert(author_id == secret.author_id);

            var heartbeat = Date.secondsSince1970();
            if (shouldRevealSecret(secret)) {
                // don't update heartbeat if secret should already be revealed
                heartbeat := secret.last_heartbeat;
            };

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
            };

            secrets.put(secret.secret_id, newSecret);

            return true;
        };

        /*
        * Updates the last_heartbeat field to the current time for all secrets of author_id.
        */
        public func sendHeartbeat(author_id: Principal) : Bool{
            var ok: Bool = true;
            let author_secrets = listSecretsOf(author_id);
            for (s in author_secrets.vals()) {
                ok := ok and sendHearbeatForSecret(author_id, s);
            };
            return ok
        };


        /*
        * Checks if a secret should be revealed.
        * This is the case if the last heartbeat was too long ago.
        */
        public func shouldRevealSecret(secret: Secret) : Bool {
            let now = Date.secondsSince1970();
            // check if last heartbeat is too long ago, if all heartbeats were made until expiry time then secret remains encrypted
            let revealOk: Bool = (Int.min(now, secret.expiry_time) - secret.last_heartbeat) > secret.heartbeat_freq;
            return revealOk;
        };


        /*
        * Checks if a secret should be revealed. See above.
        */
        public func shouldReveal(secret_id: Nat) : Bool {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return false };
                case (? secret) {
                    return shouldRevealSecret(secret);
                };
            };
        };

        /*
        * Reveals all shares for a secret.
        * The shares have to be in correct order. This is guaranteed if the shares are obtained by getRelevantSecret.
        * Too make sure that the stake holder uploads the correct shares, the decrypted shares are compared against
        * the decrypted_share_shas of the secret (created by the secret author).
        * Params:
        *   secret_id: id of secret
        *   staker_id: id of share revealer
        *   shares: decrypted shares
        */
        public func revealAllShares(secret_id: Nat, staker_id: Principal, shares: [Text]) : RevealAllSharesResult  {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return #err(#secretNotFound(secret_id)) };
                case (? secret) {
                    var share_counter: Nat = 0;

                    if (not shouldRevealSecret(secret)) {
                        return #err(#shouldNotReveal(secret.last_heartbeat + secret.heartbeat_freq));
                    };

                    for (i in Iter.range(0, secret.shares.size()-1)) {
                        if (secret.share_holder_ids[i] == staker_id) {
                            if (secret.revealed[i]) {
                                return #err(#alreadyRevealed(i));
                            };
                        };
                    };

                    let _newShares = Array.init<Text>(secret.shares.size(), "");
                    let _newRevealed = Array.init<Bool>(secret.shares.size(), false);

                    // Loop overall shares and update those that belong to staker_id.
                    // Only update if the decrypted share SHAs match.
                    for (i in Iter.range(0, _newShares.size()-1)) {
                        //D.print(Nat.toText(i) # " " # Nat.toText(secret.share_holder_ids[i]) # " " # Nat.toText(share_counter));
                        
                        if (secret.share_holder_ids[i] == staker_id) {
                            let decryptedShare: Text = shares[share_counter];
                            let decryptedShareSha: Text = SHA.sha256(decryptedShare);

                            if (decryptedShareSha != secret.decrypted_share_shas[i]) {
                                // make sure that staker uploads correct decrypted share
                                return #err(#invalidDecryptedSHA(decryptedShareSha));
                            };
                        
                            _newShares[i] := decryptedShare;
                            _newRevealed[i] := true;
                            share_counter += 1;

                        } else {

                            _newShares[i] := secret.shares[i];
                            _newRevealed[i] := secret.revealed[i]

                        };
                    };

                    if (share_counter != shares.size()) {
                        // all shares have to be revealed at once
                        return #err(#wrongNumberOfShares(share_counter));
                    };

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
                    };
                    secrets.put(secret_id, newSecret);

                    var payout = share_counter;
                    let now = Date.secondsSince1970();
                    if (now - secret.expiry_time > 86400 * 3) {
                        return #err(#tooLate(secret)); // too late
                    };

                    return #ok({secret=newSecret; payout=share_counter});
                };
            };
        };

        /*
        * If an author of a secret sends all required heartbeat and the secret expires,
        * then stakers can request payout.
        */
        public func requestPayout(secret_id: Nat, staker_id: Principal): RequestPayoutResult {
            let secret = secrets.get(secret_id);
            switch secret {
                case null { return #err(#secretNotFound(secret_id)) };
                case (? secret) {

                    if (shouldRevealSecret(secret)) {
                        return #err(#shouldReveal(secret)); // do not payout if shares should be revealed
                    };

                    for (i in Iter.range(0, secret.shares.size()-1)) {
                        if (secret.share_holder_ids[i] == staker_id) {
                            if (secret.revealed[i]) {
                                return #err(#alreadyPayedOut(i));
                            };
                        };
                    };

                    var share_counter: Nat = 0;
                    let _newRevealed = Array.init<Bool>(secret.shares.size(), false);

                    for (i in Iter.range(0, _newRevealed.size()-1)) {
                        
                        if (secret.share_holder_ids[i] == staker_id) {
                            _newRevealed[i] := true;
                            share_counter += 1;

                        } else {
                            _newRevealed[i] := secret.revealed[i];
                        };
                    };
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

                        shares = secret.shares;
                        decrypted_share_shas = secret.decrypted_share_shas;
                        revealed = newRevealed; // update
                    };
                    secrets.put(secret_id, newSecret);
                    
                    let payout = share_counter;

                    return #ok(payout);
                };
            };
        };

        /*
        * Returns all secrets.
        */
        public func listAll() : [Secret] {
            let allSecrets = Buffer.Buffer<Secret>(0);
            for ((id, s) in secrets.entries()) {
                allSecrets.add(s);
            };
            return allSecrets.toArray();
        };

        /*
        * Converts a secret to a relevant secret for staker_id.
        * A RelevantSecret only contains information relevant to the staker.
        * E.g. His/Her shares, if they should reveal or not; if they have revealed.
        */
        private func toRelevantSecret(s: Secret, staker_id: Principal): RelevantSecret {
            var shouldReveal = shouldRevealSecret(s);
            var hasPayedout = false;

            let relevantShares = Buffer.Buffer<Text>(s.shares.size());
            for (i in Iter.range(0, s.shares.size()-1)) {
                if (s.share_holder_ids[i] == staker_id) {
                    relevantShares.add(s.shares[i]);
                    hasPayedout := s.revealed[i]; // have all the same boolean for same staker_id
                };
            };

            shouldReveal := shouldReveal and not hasPayedout;

            let relevantSecret = {
                secret_id = s.secret_id;
                uploader_public_key = s.uploader_public_key;
                expiry_time = s.expiry_time;
                last_heartbeat = s.last_heartbeat;
                relevantShares = relevantShares.toArray();
                shouldReveal = shouldReveal;
                hasPayedout = hasPayedout;
            };

            return relevantSecret;
        };

        /*
        * Returns all secrets for which staker_id is share holder in the form of RelevantSecret.
        */
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

        /*
        * Returns the secret with secret_id for which the caller is a share holder in form of the RelevenatSecret type.
        */
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
        
        /*
        * Returns all secrets which are authored by author_id.
        */
        public func listSecretsOf(author_id: Principal) : [Secret] {
            let allSecrets = Buffer.Buffer<Secret>(0);
            for ((id, s) in secrets.entries()) {
                if (s.author_id == author_id) {   
                    allSecrets.add(s);
                };
            };
            return allSecrets.toArray();
        };

        /*
        * Returns all secrets which are authored by author_id
        * with additional bool whether reveal process in in progress.
        */
        public func listSecretsPlusInfoOf(author_id: Principal) : [(Secret,Bool)] {
            let allSecrets = Buffer.Buffer<(Secret, Bool)>(0);
            for ((id, s) in secrets.entries()) {
                if (s.author_id == author_id) {
                    let revealInProgress = shouldRevealSecret(s);   
                    allSecrets.add((s, revealInProgress));
                };
            };
            return allSecrets.toArray();
        };
    };
}
