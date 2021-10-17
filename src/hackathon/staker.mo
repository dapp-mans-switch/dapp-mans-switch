import Buffer "mo:base/Buffer";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Map "mo:base/HashMap";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import Types "./types";

module {
    type Staker = Types.Staker;

    public class StakerManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        // TODO: allow 1 staker multiple stakes?
        let stakers = Map.HashMap<Nat, Staker>(0, eq, Hash.hash);

        public func insert(id: Principal, name: Text, public_key: Text, amount: Nat, days: Nat) : Nat {
            //let secrets = Array.tabulate<Nat>(0, func(i:Nat) : Nat {0});
            let staker_id = stakers.size();
            let newStaker = {id; name; public_key; amount; days; staker_id};
            stakers.put(staker_id, newStaker);
            staker_id;
        };

        // public func addSecret(staker_id: Nat, secret_id: Nat) : Bool {
        //     let staker = stakers.get(staker_id);
        //     switch staker {
        //         case null { return false };
        //         case (? staker) {
        //             // TODO: authentification
        //             // TODO: disallow adding a secret twice

        //             let s = Array.tabulate<Nat>(1, func(i:Nat) : Nat {secret_id});
        //             let newSecrets = Array.append<Nat>(staker.secrets, s);
        //             // TODO: no better way?
        //             let newStaker = {
        //                 id = staker.id;
        //                 name = staker.name;
        //                 public_key = staker.public_key;
        //                 amount = staker.amount;
        //                 days = staker.days;
        //                 secrets = newSecrets;
        //                 staker_id = staker.staker_id;
        //             };
        //             stakers.put(staker_id, newStaker);
        //             return true;
        //         };
        //     };
        // };

        public func lookup(id: Nat) : ?Staker {
            stakers.get(id);
        };

        public func remove(id: Nat): Bool {
            let removedStaker = stakers.remove(id);

            // check if staker was removed
            switch (removedStaker) {
                case null {
                    false;
                };
                case (? v) {
                    true;
                };
            }
        };

        /*
        public func edit(id: Principal, name: Text, amount: Nat, days:Nat) : Bool {
            let stakerRemoved = remove(id);
            if (stakerRemoved == true) {
                stakers.put(id, {id; name; amount; days});
                true;
            } else {
                false;
            };
        };
        */

        public func listAll() : [Staker] {
            let allStakers = Buffer.Buffer<Staker>(0);
            for ((id, s) in stakers.entries()) {
                allStakers.add(s);
            };
            return allStakers.toArray();
        };
    }
};
