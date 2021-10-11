
/*
Maybe use actors instead of static types?

dfx canister call hackathon getCounter 3
is slow

returns a service with canister_id which can then be called with

dfx canister call {canister_id} getCount

dfx canister call {canister_id} updateCount '(5)'
does not work however, "traps" canister

https://sdk.dfinity.org/docs/language-guide/actors-async.html

https://sdk.dfinity.org/docs/language-guide/sharing.html


*/

actor class Counter(init: Nat) {
    var count: Nat = init;

    public func updateCount(new: Nat) : async Bool {
        count := new;
        true;
    };

    public query func getCount() : async Nat {
        count
    };
}