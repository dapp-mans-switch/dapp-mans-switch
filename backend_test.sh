

echo "Adding stakers"
dfx identity use default
default_principal=$(dfx identity get-principal)
echo $default_principal
dfx canister call hackathon registerStaker '("Markus", "pubkey", 10, 10)'


dfx identity use anonymous
test_principal=$(dfx identity get-principal)
echo $test_principal
dfx canister call hackathon registerStaker '("Test", "pubkey", 10, 10)'

dfx identity use default

dfx canister call hackathon listAllStakers

echo "\n\n\nAdding secret"
dfx canister call hackathon addSecret '("secret", "uploaderpubkey", 10, 1635724799, 86400, vec {"share1"; "share2"; "share3"}, vec {principal "'"${default_principal}"'"; principal "'"${test_principal}"'"; principal "'"${default_principal}"'"}, vec {1;2;1})'

dfx canister call hackathon lookupSecret 0

echo "\n\n\nReveal secret"
dfx canister call hackathon revealAllShares '(0, 1, vec {"A"; "B"})'

echo "\n\n\nAdding secrets"
dfx canister call hackathon addSecret '("secret", "uploaderpubkey", 10, 1535724799, 86400, vec {"share1"; "share2"; "share3"}, vec {principal "'"${default_principal}"'"; principal "'"${default_principal}"'"; principal "'"${default_principal}"'"}, vec {1;1;1})'

dfx canister call hackathon addSecret '("secret", "uploaderpubkey", 10, 1635724799, 86400, vec {"share1"; "share2"; "share3"}, vec {principal "'"${test_principal}"'"; principal "'"${test_principal}"'"; principal "'"${test_principal}"'"}, vec {2;2;2})'

dfx identity use anonymous

dfx canister call hackathon addSecret '("secret", "uploaderpubkey", 10, 1535724799, 86400, vec {"share1"; "share2"; "share3"}, vec {principal "'"${default_principal}"'"; principal "'"${default_principal}"'"; principal "'"${default_principal}"'"}, vec {1;1;1})'

dfx canister call hackathon addSecret '("secret", "uploaderpubkey", 10, 1635724799, 86400, vec {"share1"; "share2"; "share3"}, vec {principal "'"${test_principal}"'"; principal "'"${test_principal}"'"; principal "'"${test_principal}"'"}, vec {2;2;2})'

dfx identity use default


echo "\n\n\n All secrets"
dfx canister call hackathon listAllSecrets


echo "\n\n\n Relevant secrets"
dfx canister call hackathon listRelevantSecrets 1
