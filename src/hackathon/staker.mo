import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Buffer "mo:base/Buffer";

import Types "./types";

module {
    type Staker = Types.Staker;

    public class StakerManager() {

        let eq: (Nat,Nat) -> Bool = func(x, y) { x == y };

        let stakers = Map.HashMap<Nat, Staker>(0, eq, Hash.hash);

        public func insert(name: Text, amount: Nat, days:Nat): Nat {
            let newStaker = {name; amount; days};
            let id = stakers.size();
            stakers.put(id, newStaker);
            return id;
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

        public func edit(id: Nat, name: Text, amount: Nat, days:Nat) : Bool {
            let stakerRemoved = remove(id);
            if (stakerRemoved == true) {
                stakers.put(id, {name; amount; days});
                true;
            } else {
                false;
            };
        };

        public func listAll() : [Staker] {
            let allStakers = Buffer.Buffer<Staker>(0);
            for ((id, s) in stakers.entries()) {
                allStakers.add(s);
            };
            return allStakers.toArray();
        };

    }

};
