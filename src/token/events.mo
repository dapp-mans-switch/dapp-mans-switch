module Events {
    public type Transfer = shared (
        from : Principal,
        to : Principal,
        value : Nat,
    ) -> async ();
    public func fireTransfer(
        e : ?Transfer,
        from : Principal,
        to : Principal,
        value : Nat,
    ) : async () {
        switch (e) {
            case (null) {                            };
            case (? c)  { ignore c(from, to, value); };
        };
    };

    public type Approval = shared (
        owner : Principal,
        spender : Principal,
        value : Nat
    ) -> async ();
    public func fireApproval(
        e : ?Approval,
        owner : Principal,
        spender : Principal,
        value : Nat,
    ) : async () {
        switch (e) {
            case (null) {                                  };
            case (? c)  { ignore c(owner, spender, value); };
        };
    };
}
