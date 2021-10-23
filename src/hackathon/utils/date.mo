

import Time "mo:base/Time";

module {
    public func secondsSince1970() : Int {
        return Time.now() / 1_000_000_000;
    };
}