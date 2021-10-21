module {
    public type Stake = {
        staker_id: Principal;
        public_key: Text;
        amount: Nat;
        expiry_time: Int; // seconds since 1970-01-01
        stake_id: Nat;
    };

    public type Staker = {
        id: Principal;
        public_key: Text;
    };

    // TODO: add checksum to make sure that correct shares were uploaded?
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

        share_holder_ids: [Principal];
        share_holder_stake_ids: [Nat]; // as of now unused, maybe use for calculating payout
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
