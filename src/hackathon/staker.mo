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
import Date "./utils/date";

module {
    type Stake = Types.Stake;
    type Staker = Types.Staker;


    public type GetPrincipalsError = {#stakeIdNotFound: Nat};
    public type GetPrincipalsResult = Result.Result<[Principal], GetPrincipalsError>;


    public type EndStakeError = {#stakeNotFound: Nat; #permissionDenied: Principal; #alreadyPayedOut: Stake; #insufficientFunds: Nat};
    public type EndStakeSuccess = {#payout: Nat};
    public type EndStakeResult = Result.Result<EndStakeSuccess, EndStakeError>;

    public type RegisterStakerError = {#alreadyRegistered: Principal; #invalidKey: Text};
    public type RegisterStakerResult = Result.Result<Text, RegisterStakerError>;

    public type AddStakeError = {#unknownStaker: Principal; #invalidDuration: Int; #transferError: Text};
    public type AddStakeResult = Result.Result<Nat, AddStakeError>;

    public type DrawStakesError = {#noStakes: Int};
    public type DrawStakesResult = Result.Result<[Stake], DrawStakesError>;

    public class StakerManager() {

        public var stakes = Map.HashMap<Nat, Stake>(0, Nat.equal, Hash.hash);

        // map staker to public key
        public var stakers = Map.HashMap<Principal, Text>(0, Principal.equal, Principal.hash);


        /*
        * Looks up stakes and returns their principals.
        * Returns an GetPrincipalsError if stake_id is not found,
        */
        public func getPrincipals(stake_ids: [Nat]) : GetPrincipalsResult {
            var principals: [Principal] = [];
            for (stake_id in stake_ids.vals()) {
                switch (stakes.get(stake_id)) {
                    case null {
                        return #err(#stakeIdNotFound(stake_id));
                    };
                    case (? s) {
                        principals := Array.append(principals, [s.staker_id]);
                    }
                }
            };
            return #ok(principals);
        };

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

        /*
        * Checks if a caller with staker_id is a registered staker.
        */
        public func isRegistered(staker_id: Principal) : Bool {
            let existing_public_key = stakers.get(staker_id);
            switch (existing_public_key) {
                case null {
                    return false;
                };
                case (? v) {
                    return true;
                };
            };
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
                    let now = Date.secondsSince1970();
                    let expiry_time = now + days * 86400;
                    let valid = true;
                    
                    let newStake = {staker_id; public_key; amount; expiry_time; stake_id; valid};
                    stakes.put(stake_id, newStake);
                    return #ok(stake_id);
                };
            };
        };

        /*
        * Deletes stake with stake_id. Just for internal use.
        */
        public func deleteStake(stake_id: Nat): ?Stake {
            stakes.remove(stake_id);
        };

        /*
        * Ends stake by setting the expiry_time to now.
        */
        public func endStake(staker_id: Principal, stake_id: Nat) : EndStakeResult {
            switch (stakes.get(stake_id)) {
                case null {
                    return #err(#stakeNotFound(stake_id));
                };
                case (? stake) {
                    if (stake.staker_id != staker_id) {
                        return #err(#permissionDenied(staker_id));
                    };
                    if (not stake.valid) {
                        return #err(#alreadyPayedOut(stake));
                    };
                    let now = Date.secondsSince1970();
                    let stake_expiry_time = stake.expiry_time;
                    let newStake = {
                        staker_id = stake.staker_id;
                        public_key = stake.public_key;
                        amount = stake.amount;
                        expiry_time = now; // update
                        stake_id = stake.stake_id;
                        valid = false;
                    };
                    stakes.put(stake_id, newStake);

                    if (now >= stake_expiry_time) {
                        return #ok(#payout(stake.amount));
                    } else {
                        // ended stake too soon -> penalty
                        return #ok(#payout(stake.amount / 2));
                    };
                };
            };
        };

        /*
        * Returns stake for stake id if there is a matching stake.
        */
        public func lookup(id: Nat) : ?Stake {
            stakes.get(id);
        };

        /*
        * Returns the public key for a staker id, if the staker is in the system
        */
        public func publicKeyFor(staker_id: Principal) : ?Text {
            stakers.get(staker_id);
        };

        /*
        * Returns all stakes.
        */
        public func listAllStakes() : [Stake] {
            let allStakes = Buffer.Buffer<Stake>(0);
            for ((id, s) in stakes.entries()) {
                allStakes.add(s);
            };
            return allStakes.toArray();
        };

        /*
        * Returns all stakes for staker with staker_id.
        */
        public func listStakesOf(staker_id: Principal) : [Stake] {
            let allStakes = Buffer.Buffer<Stake>(0);
            for ((id, s) in stakes.entries()) {
                if (s.staker_id == staker_id) {
                    allStakes.add(s);
                };
            };
            return allStakes.toArray();
        };
        
        /*
        * Returns all stakers.
        */
        public func listAllStakers() : [Staker] {
            let allStakers = Buffer.Buffer<Staker>(0);
            for ((id, public_key) in stakers.entries()) {
                allStakers.add({id; public_key});
            };
            return allStakers.toArray();
        };


        /*
        * In order to let a user add a secret we have to assert that the uploader uses
        * the shares from drawStakes.
        * Therefore, we cache them to verify later in the addSecret call.
        */
        let drawnStakesCache = Map.HashMap<Principal, [Stake]>(0, Principal.equal, Principal.hash);

        /*
        * Checks if the cached stakes for author_id (stored in drawnStakesCache) have ids equal to stake_ids.
        */
        public func verifySelectedStakes(author_id: Principal, stake_ids: [Nat]) : Bool {
            switch (drawnStakesCache.get(author_id)) {
                case null { return false; };
                case (? cachedStakes) {
                    let cachedStakesId: [Nat] = Array.map(cachedStakes, func (s: Stake) : Nat { s.stake_id });
                    return (cachedStakesId == stake_ids);
                };
            };
        };

        /*
        * Removes the cachec stakes for author_id.
        * Returns true if there was an entry to remove, false otherwise.
        */
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

        /*
        * Randomly draws stakes proporitional to their amount, which have to be used
        * for a new secret. Does not draw stakes which belong to the author.
        * Params:
        *   - author_id: The caller principal id of the author of the secret.
        *   - expiry_time: The desired expiry time of the secret. Only stakes
        *     which are expiry after this time are drawn.
        *   - n: The number of stakes to be drawn.
        * Returns:
        *   On success the drawn stakes.
        *   Retruns an error with the expiry_time if there are no stakes for expiry_time.
        */
        public func drawStakes(author_id: Principal, expiry_time: Int, n: Nat): async DrawStakesResult {
            // first we count the total amount of tokens held by (not expired) stakes
            var totalAmount: Nat = 0;
            for ((id, s) in stakes.entries()) {
                if ((expiry_time < s.expiry_time) and (s.staker_id != author_id)) {
                    totalAmount += s.amount;
                };
            };
            if (totalAmount == 0) {
                return #err(#noStakes(expiry_time));
            };

            // Obtains a full blob (32 bytes) worth of fresh cryptographic entropy
            let entropy: Blob = await Random.blob(); 
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
                        if (i >= n) { break outer; };

                    } else {
                        break inner;
                    };
                };
            };

            let drawnStakesArr = drawnStakes.toArray();
            drawnStakesCache.put(author_id, drawnStakesArr);
            return #ok(drawnStakesArr);
        };
    };

};
