

import Types "./types";
import Staker "./staker";


actor {
    type Staker = Types.Staker;

    public func greet(content : Text) : async Text {
        return "New forum post: " # content # "!!!";
    };

    var stakerManager: Staker.StakerManager = Staker.StakerManager();

    public func addStaker(name: Text, amount: Nat, days:Nat): async Nat { 
        stakerManager.insert(name, amount, days);
    };

    public query func lookupStaker(id: Nat) : async ?Staker {
        stakerManager.lookup(id);
    };

    public func removeStaker(id: Nat): async Bool {
        stakerManager.remove(id);
    };

    public func editStaker(id: Nat, name: Text, amount: Nat, days:Nat) : async Bool {
        stakerManager.edit(id, name, amount, days);
    };

    public query func listAllStakers() : async [Staker] {
        stakerManager.listAll();
    };

};
