import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Map "mo:base/HashMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Random "mo:base/Random";
import Result "mo:base/Result";

import D "mo:base/Debug";

import Types "./types";
import RNG "./utils/rng";
import base64 "./utils/base64";

module {
    type Stake = Types.Stake;
    type Staker = Types.Staker;


    public type RegisterStakerError = {#alreadyRegistered: Principal; #invalidKey: Text};
    public type RegisterStakerResult = Result.Result<Text, RegisterStakerError>;

    public type AddStakeError = {#unknownStaker: Principal; #invalidDuration: Int};
    public type AddStakeResult = Result.Result<Nat, AddStakeError>;

    public class StakerManager() {

        let stakes = Map.HashMap<Nat, Stake>(0, Nat.equal, Hash.hash);

        // map staker to public key
        let stakers = Map.HashMap<Principal, Text>(0, Principal.equal, Principal.hash);

        /*
        * Register a staker with his principal caller id.
        * Params:
        *   - staker_id: principal of staker
        *   - public_key: public key of staker. Should be a base 64 string
                Secret shares are encrypted with this key and the staker should be able to
                decrypt them with his private key.
        * Returns:
        *   RegisterStakerResult {#ok: Principal, #err: {#alreadyRegistered; #invalidKey}}
        */
        public func registerStaker(staker_id: Principal, public_key: Text) : RegisterStakerResult {
            let existing_public_key = stakers.get(staker_id);
            switch (existing_public_key) {
                case null {
                    if (not base64.validateBase64(public_key)) {
                        return #err(#invalidKey(public_key));
                    };
                    stakers.put(staker_id, public_key);
                    return #ok(public_key);
                };
                case (? v) {
                    return #err(#alreadyRegistered(staker_id));
                };
            };
        };

        
        func secondsSince1970() : Int {
            return Time.now() / 1_000_000_000;
        };

        /*
        * Add a stake for staker.
        * Params:
        *   - staker_id: principal of staker
        *   - amount: the number of tokens to stake
        *   - days: the duration of the stake in days
        * Returns:
        *   AddStakeResult {#ok: Nat, #err: {#unknownStaker: Principal, #invalidDuration: Int}}
        *       stake_id on success
        */
        public func addStake(staker_id: Principal, amount: Nat, days: Nat) : AddStakeResult {
            if (days == 0) {
                return #err(#invalidDuration(days));
            };
            let public_key = stakers.get(staker_id);
            switch (public_key) {
                case null {
                    return #err(#unknownStaker(staker_id));
                };
                case (? public_key) {
                    let stake_id = stakes.size()+1;
                    let now = secondsSince1970();
                    let expiry_time = now + days * 86400;
                    
                    let newStake = {staker_id; public_key; amount; expiry_time; stake_id};
                    stakes.put(stake_id, newStake);
                    return #ok(stake_id);
                };
            };
        };

        public func lookup(id: Nat) : ?Stake {
            stakes.get(id);
        };

        public func publicKeyFor(staker_id: Principal) : ?Text {
            stakers.get(staker_id);
        };

        public func remove(id: Nat): Bool {
            let removedStake = stakes.remove(id);

            // check if staker was removed
            switch (removedStake) {
                case null {
                    false;
                };
                case (? v) {
                    true;
                };
            };
        };

        public func listAllStakes() : [Stake] {
            let allStakes = Buffer.Buffer<Stake>(0);
            for ((id, s) in stakes.entries()) {
                allStakes.add(s);
            };
            return allStakes.toArray();
        };

        public func listStakesOf(staker_id: Principal) : [Stake] {
            let allStakes = Buffer.Buffer<Stake>(0);
            for ((id, s) in stakes.entries()) {
                if (s.staker_id == staker_id) {
                    allStakes.add(s);
                };
            };
            return allStakes.toArray();
        };
        
        public func listAllStakers() : [Staker] {
            let allStakers = Buffer.Buffer<Staker>(0);
            for ((id, public_key) in stakers.entries()) {
                allStakers.add({id; public_key});
            };
            return allStakers.toArray();
        };


        let drawnStakesCache = Map.HashMap<Principal, [Stake]>(0, Principal.equal, Principal.hash);

        public func verifySelectedStakes(author_id: Principal, stake_ids: [Nat]) : Bool {
            switch (drawnStakesCache.get(author_id)) {
                case null { return false; };
                case (? cachedStakes) {
                    let cachedStakesId: [Nat] = Array.map(cachedStakes, func (s: Stake) : Nat { s.stake_id });
                    return (cachedStakesId == stake_ids);
                };
            };
        };

        public func removeCachedStakes(author_id: Principal) : Bool {
            let removedEntry = drawnStakesCache.remove(author_id);
            switch (removedEntry) {
                case null {
                    false;
                };
                case (? v) {
                    true;
                };
            };
        };

        public func drawStakes(author_id: Principal, expiry_time: Int, n: Nat): async [Stake] {
            // first we count the total amount of tokens held by (not expired) stakes
            var totalAmount: Nat = 0;
            for ((id, s) in stakes.entries()) {
                if ((expiry_time < s.expiry_time) and (s.staker_id != author_id)) {
                    totalAmount += s.amount;
                };
            };
            if (totalAmount == 0) {
                return [];
            };

            let entropy: Blob = await Random.blob(); // Obtains a full blob (32 bytes) worth of fresh cryptographic entropy
            let seeds: RNG.Seeds = RNG.getSeedsFromEntropy(entropy);
            let randomAmounts: [Nat] = Array.sort(RNG.randomNumbersBelow(seeds, totalAmount, n), Nat.compare);  
            D.print("randomAmounts:"); // TODO: remove
            for (a in randomAmounts.vals()) { D.print(Nat.toText(a)); };        

            // now we iterate over all stakes
            let drawnStakes = Buffer.Buffer<Stake>(0);
            var i: Nat = 0;
            var current_amount: Nat = 0;
            // we assign each stake the range (current_amount, current_amount + stake.amount]
            // if a random number falls into this range than the stake is drawn
            // we sort the randomAmounts such that we have to loop over the stakes only once
            // and can draw a single stake multiple times in the inner loop
            label outer for ((id, s) in stakes.entries()) {
                if ((s.expiry_time <= expiry_time) or (s.staker_id == author_id)) {
                    continue outer;
                };
                
                current_amount += s.amount; // stakes receive shares proportional to their amount
                label inner while (true) {
                    if (randomAmounts[i] <= current_amount) {
                        drawnStakes.add(s);
                        i += 1;
                        if (i >= n) { break inner; };

                    } else {
                        break inner;
                    };
                };
            };

            let drawnStakesArr = drawnStakes.toArray();
            drawnStakesCache.put(author_id, drawnStakesArr);
            return drawnStakesArr;
        };
    };

};
