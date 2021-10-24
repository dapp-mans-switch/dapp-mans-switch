import Error "mo:base/Error";
import Nat "mo:base/Nat";

module Errors {
    public func InsufficientBalance(balance : Nat, value : Nat) : Error {
        Error.reject("Insufficient balance (" # Nat.toText(balance) # ") to transfer " # Nat.toText(value) # " tokens.");
    };

    public func InsufficientAllowance(allowed : Nat, value : Nat) : Error {
        Error.reject("Insufficient allowance (" # Nat.toText(allowed) # ") to transfer " # Nat.toText(value) # " tokens.");
    };
};
