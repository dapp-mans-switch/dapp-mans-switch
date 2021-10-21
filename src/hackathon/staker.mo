import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Map "mo:base/HashMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Types "./types";

module {
    type Stake = Types.Stake;

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

        public func listAll() : [Stake] {
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
    };
};
