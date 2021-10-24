

echo "Adding stakers"
dfx identity use default
default_principal=$(dfx identity get-principal)
echo $default_principal
dfx canister call hackathon registerStaker "iw4mSYWgilQHkpGXFeTRPJiXhUlko7r5y9pTOIaZmUw="
dfx canister call token buyIn 10000
dfx canister call token approve '(principal "rrkah-fqaaa-aaaaa-aaaaq-cai", 30, null)'
dfx canister call hackathon addStake '(10, 10)'
dfx canister call hackathon addStake '(10, 20)'
dfx canister call hackathon addStake '(10, 30)'
dfx canister call hackathon addStake '(10, 40)'


dfx identity use anonymous
test_principal=$(dfx identity get-principal)
echo $test_principal
dfx canister call hackathon registerStaker "iw4mSYWgilQHkpGXFeTRPJiXhUlko7r5y9pTOIaZmUw="
dfx canister call token buyIn 200
dfx canister call token approve '(principal "rrkah-fqaaa-aaaaa-aaaaq-cai", 80, null)'
dfx canister call hackathon addStake '(20, 20)'
dfx canister call hackathon addStake '(20, 30)'
dfx canister call hackathon addStake '(20, 40)'
dfx canister call hackathon addStake '(20, 50)'

dfx identity use default