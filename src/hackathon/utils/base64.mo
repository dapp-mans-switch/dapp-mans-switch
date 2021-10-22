import Text "mo:base/Text";
import Nat "mo:base/Nat";
import D "mo:base/Debug";
import Iter "mo:base/Iter";

module {

    // Has to match this pattern:
    //^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$
    public func validateBase64(str : Text) : Bool {
        let length: Nat = str.size();
        if (length % 4 != 0) {
            // groups of 4 chars
            return false;
        };
        let strippedStr = Text.trimEnd(str, #char('='));
        let d: Nat = length - strippedStr.size();
        if (d != 1 and d != 2) {
            // at the end one or two =
            return false;
        };
        // [A-Za-z0-9+\/]
        let okchars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/"; 
        for (c in strippedStr.chars()) {
            if (not Text.contains(okchars, #char(c))) {
                return false;
            };
        };

        return true;
  };
}