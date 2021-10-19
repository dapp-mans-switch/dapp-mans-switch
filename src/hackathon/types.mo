module {
    public type Staker = {
        id: Principal;
        name: Text;
        public_key: Text;
        amount: Nat;
        days: Nat;
        //secrets: [Nat];
        staker_id: Nat;
    };

    public type Secret = {
        secret_id: Nat;
        author_id: Principal;

        // encrypted secret payload, that can be decrypted with the privatekey
        // reconstructed from enough shares
        payload: Text;
        uploader_public_key: Text;
        reward: Nat;

        expiry_time: Int; // seconds since 1970-01-01
        last_heartbeat: Int;
        heartbeat_freq: Int; // every heartbeat_freq a heartbeat has to be sent

        // share at position i is encrypted with public key of staker at position i in key_holders,
        // once the share is decrypted the correspoding entry in revealed is set to true,
        key_holders: [Principal]; // staker ids
        share_holder_ids: [Nat];
        shares: [Text];
        revealed: [Bool];

        valid: Bool;
    };


    public type RelevantSecret = {
        secret_id: Nat;
        uploader_public_key: Text;
        relevantShares: [Text];
        shouldReveal: Bool;
        hasRevealed: Bool;
    };

}
