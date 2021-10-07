import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import List "mo:base/List";
import Buffer "mo:base/Buffer";

actor {

    let eq: (Nat,Nat) ->Bool = func(x, y) { x == y };

    type Staker = {
        name: Text;
        amount: Nat;
        days: Nat;
    };

    stable var next : Nat = 1;
    let stakers = Map.HashMap<Nat, Staker>(0, eq, Hash.hash);

    public func insert(name: Text, amount: Nat, days:Nat): async Nat {
        let newStaker = {name; amount; days};
        stakers.put(next, newStaker);
        next += 1;
        next-1;
    };

    public query func lookup(id: Nat) : async ?Staker {
        stakers.get(id);
    };

    public func remove(id: Nat): async Bool {
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

    public func edit(id: Nat, name: Text, amount: Nat, days:Nat) : async Bool {
        let stakerRemoved = await remove(id);
        if (stakerRemoved == true) {
            stakers.put(id, {name; amount; days});
            true;
        } else {
            false;
        };
    };

    public query func listAll() : async [Staker] {
        let allStakers = Buffer.Buffer<Staker>(0);
        for ((id, s) in stakers.entries()) {
            allStakers.add(s);
        };
        return allStakers.toArray();
    };

};
