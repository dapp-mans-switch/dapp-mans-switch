
/*
Maybe use actors instead of static types?

dfx canister call hackathon getCounter 3
is slow

returns a service with canister_id which can then be called with

dfx canister call {canister_id} getCount

dfx canister call {canister_id} updateCount '(5)'

https://sdk.dfinity.org/docs/language-guide/actors-async.html

https://sdk.dfinity.org/docs/language-guide/sharing.html

Principals and caller identification

Motoko’s shared functions support a simple form of caller identification
that allows you to inspect the Internet Computer principal associated with
the caller of a function. The principal associated with a call is a value
that identifies a unique user or canister smart contract.
https://sdk.dfinity.org/docs/language-guide/caller-id.html
*/

import D "mo:base/Debug";
import Principal "mo:base/Principal";

shared(msg) actor class Counter(counterOwner:Principal, init: Int) {
    let owner = counterOwner;
    var count: Int = init;

    public shared(msg) func updateCount(newCount: Int) : async Bool {
        D.print("updateCount called by " # Principal.toText(msg.caller) # ", owner " # Principal.toText(owner));
        assert(owner == msg.caller);
        count := newCount;
        true;
    };

    public query func getCount() : async Int {
        D.print("getCount called by " # Principal.toText(msg.caller) # ", owner " # Principal.toText(owner));
        count;
    };
}