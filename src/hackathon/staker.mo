import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";

import Types "./types";

module {
    type Staker = Types.Staker;

    public class StakerManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        // TODO: allow 1 staker multiple stakes?
        let stakers = Map.HashMap<Nat, Staker>(0, eq, Hash.hash);

        public func insert(id: Principal, name: Text, public_key: Nat, amount: Nat, days:Nat) : Nat {
            let newStaker = {id; name; public_key; amount; days};
            let stake_id = stakers.size();
            stakers.put(stake_id, newStaker);
            stake_id;
        };

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

        /*public func edit(id: Principal, name: Text, amount: Nat, days:Nat) : Bool {
            let stakerRemoved = remove(id);
            if (stakerRemoved == true) {
                stakers.put(id, {id; name; amount; days});
                true;
            } else {
                false;
            };
        };*/

        public func listAll() : [Staker] {
            let allStakers = Buffer.Buffer<Staker>(0);
            for ((id, s) in stakers.entries()) {
                allStakers.add(s);
            };
            return allStakers.toArray();
        };

    }

};
