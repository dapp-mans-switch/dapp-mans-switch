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


import Types "./types";
import RNG "./utils/rng";

module {
    type Stake = Types.Stake;
    type Staker = Types.Staker;

    public class StakerManager() {

        // allow staker multiple stakes!
        let stakes = Map.HashMap<Nat, Stake>(0, Nat.equal, Hash.hash);

        // map staker to public key
        let stakers = Map.HashMap<Principal, Text>(0, Principal.equal, Principal.hash);

        public func registerStaker(staker_id: Principal, public_key: Text) : Bool {
            let existing_public_key = stakers.get(staker_id);
            switch (existing_public_key) {
                case null {
                    stakers.put(staker_id, public_key);
                    return true;
                };
                case (? v) {
                    return false; // error already registered
                };
            };
        };

        
        func secondsSince1970() : Int {
            return Time.now() / 1_000_000_000;
        };

        public func addStake(staker_id: Principal, amount: Nat, days: Nat) : Nat {
            let public_key = stakers.get(staker_id);
            switch (public_key) {
                case null {
                    return 0; // error staker_id unknown
                };
                case (? public_key) {
                    let stake_id = stakes.size()+1;
                    let now = secondsSince1970();
                    let expiry_time = now + days * 86400;
                    
                    let newStake = {staker_id; public_key; amount; expiry_time; stake_id};
                    stakes.put(stake_id, newStake);
                    return stake_id;
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


        //let drawnStakes = Map.HashMap<Principal, Stake>(0, Principal.equal, Principal.hash);

        public func drawStakes(author_id: Principal, expiry_time: Int, n: Nat): [Stake] {
            // first we count the total amount of tokens held by (not expired) stakes
            var totalAmount: Nat = 0;
            for ((id, s) in stakes.entries()) {
                if (expiry_time < s.expiry_time) {
                    totalAmount += s.amount;
                };
            };


            // now we draw random numbers from 0 to totalAmount
            let now: Int = Time.now(); // seed for rng
            let seed: Text = Int.toText(now);
            let randomAmounts: [Nat] = Array.sort(RNG.randomNumbersBelow(seed, totalAmount, n), Nat.compare);          

            // now we iterate over all stakes
            let drawnStakes = Buffer.Buffer<Stake>(0);
            var i: Nat = 0;
            var current_amount: Nat = 0;
            // we assign each stake the range (current_amount, current_amount + stake.amount]
            // if a random number falls into this range than the stake is drawn
            // we sort the randomAmounts such that we have to loop over the stakes only once
            // and can draw a single stake multiple times in the inner loop
            label outer for ((id, s) in stakes.entries()) {
                if (s.expiry_time <= expiry_time) {
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

            return drawnStakes.toArray();
        };
    };
};
