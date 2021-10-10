

module {
    public type Staker = {
        name: Text;
        //public_key: Nat;
        amount: Nat;
        days: Nat;
    };

    public type Secret = {
        secret_id:Nat;
        author_id: Nat;

        // encrypted secret payload, that can be decrypted with keys once enough keys are revealed
        payload: Text; 
        reward: Nat;

        expiry_time: Int; // nanoseconds since 1970-01-01
        last_heartbeat: Int;
        heartbeat_freq: Nat; // every heartbeat_freq a heartbeat has to be sent

        // key at position i is encrypted with public key of staker at position i in key_holders,
        // once the key is decrypted the correspoding entry in revealed is set to true, 
        key_holders: [Nat]; // staker ids
        keys: [Nat];
        revealed: [Bool];

        valid: Bool;
    }


}