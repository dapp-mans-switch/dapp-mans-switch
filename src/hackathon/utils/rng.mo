

import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Random "mo:base/Random";

import SHA "./SHA256";

module {
    // https://en.wikipedia.org/wiki/Xorshift#xorshift+
    // https://gist.github.com/chchrist/927b0c8ffe36a52b11522f470b81f216
    public class PRNG(seed0: Nat64, seed1: Nat64) {

        var state0: Nat64 = seed0;
        var state1: Nat64 = seed1;


        func xorshift128plus(): Nat64 {

            var a = state0; // s1
            var b = state1; // s0

            state0 := b;

            a ^= a << 23;
            a ^= a >> 18;
            a ^= b;
            a ^= b >> 5;

            state1 := a;
            
            return Nat64.fromNat((Nat64.toNat(a) + Nat64.toNat(b)) % 18_446_744_073_709_551_616); // handle overflows
            
        };


        public func randomNumber() : Nat64 {
            return xorshift128plus();
        };

        public func randomNumberBelow(n: Nat) : Nat {
            let x: Nat = Nat64.toNat(xorshift128plus());
            return (x * n / 18_446_744_073_709_551_615); // probably should round instead of truncate
        };
        
    };


    public type Seeds = {
        seed0: Nat64;
        seed1: Nat64;
    };

    // entropy should have at least 16 bytes
    public func getSeedsFromEntropy(entropy: Blob): Seeds {
        let f = Random.Finite(entropy);
        var seed0: Nat64 = 0;
        switch (f.range(64)) { // [0 ... 2^64-1] = Nat64, consumes at least 8 bytes of entropy
            case null {}; // should not happen
            case (? v) {
                seed0 := Nat64.fromNat(v);
            };
        };
        var seed1: Nat64 = 0;
        switch (f.range(64)) { // [0 ... 2^64-1] = Nat64, consumes at least 8 bytes of entropy
            case null {}; // should not happen
            case (? v) {
                seed1 := Nat64.fromNat(v);
            };
        };
        return {seed0; seed1};
    };

    public func getShaSeeds(seed: Text): Seeds {
        let nat8Arr: [Nat8] = Blob.toArray(Text.encodeUtf8(seed));
        let sha: [Nat8] = SHA._sha256(nat8Arr);

        var seed0: Nat64 = 0;
        var seed1: Nat64 = 0;

        for (i in Iter.range(0,7)) {
            seed0 += Nat64.fromNat(Nat8.toNat(sha[i])) << Nat64.fromNat(8 * i);
            seed1 += Nat64.fromNat(Nat8.toNat(sha[i+8])) << Nat64.fromNat(8 * i);
        };

        return {seed0; seed1};
    };

    public func randomNumbers(seeds: Seeds, n: Nat) : [Nat64] {
        let rng = PRNG(seeds.seed0, seeds.seed1);
        Array.tabulate<Nat64>(n, func (i: Nat) : Nat64 { rng.randomNumber() });
    };

    public func randomNumbersBelow(seeds: Seeds, below: Nat, n: Nat) : [Nat] {
        let rng = PRNG(seeds.seed0, seeds.seed1);
        Array.tabulate<Nat>(n, func (i: Nat) : Nat { rng.randomNumberBelow(below) });
    };
    
};