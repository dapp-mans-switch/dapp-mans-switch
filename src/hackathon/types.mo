module {
    public type Stake = {
        staker_id: Principal; // owner of stake
        public_key: Text; // public key of owner with which shares will be encrypted
        amount: Nat; // amount of tokens staked
        expiry_time: Int; // seconds since 1970-01-01
        stake_id: Nat; // id
        valid: Bool; // invalid if owner ended stake and got back tokens
    };

    public type Staker = {
        id: Principal;
        public_key: Text;
    };

    public type Secret = {
        secret_id: Nat;
        author_id: Principal;

        // encrypted secret payload, that can be decrypted with the private key
        // reconstructed from enough shares
        payload: Text;
        uploader_public_key: Text;
        reward: Nat;

        /*
        A secret author creates a secret with heartbeat_freq and expiry_time.
       They have to confirm every heartbeat_freq seconds that they are still alive until
       the secret expires. If they fail to do so, the stakers will publish their secret
       share which allows to reconstruct the public key and decrypt the secret.
       If the secret author sends all required heartbeats until expiry, the secret remains encrypted. 
        */
        expiry_time: Int; // seconds since 1970-01-01
        last_heartbeat: Int; // last time a heatbeat was sent
        heartbeat_freq: Int; // every heartbeat_freq a heartbeat has to be sent

        share_holder_ids: [Principal]; // owner of share_holder_stake
        share_holder_stake_ids: [Nat]; // stakes which received a secret share

        shares: [Text]; // en- and decrypted secret shares, which are used to reconstruct private key
        decrypted_share_shas: [Text]; // sha256 hashes of decrypted shares which guarantee that stakers upload correct secret shares
        revealed: [Bool]; // is true if stake has revealed share or secret expired and reward was paid out
    };

    /*
    * A RelevantSecret only contains information relevant to the staker.
    * E.g. His/Her shares, if they should reveal or not; if they have revealed.
    */
    public type RelevantSecret = {
        secret_id: Nat;
        uploader_public_key: Text;
        expiry_time: Int;
        last_heartbeat: Int;
        relevantShares: [Text];
        shouldReveal: Bool;
        hasPayedout: Bool;
    };

}
