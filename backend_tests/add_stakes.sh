
echo "Adding stakes"
dfx identity use default
default_principal=$(dfx identity get-principal)
echo $default_principal

dfx canister call hackathon registerStaker "iw4mSYWgilQHkpGXFeTRPJiXhUlko7r5y9pTOIaZmUw="
dfx canister call hackathon addStake '(10, 10)'
dfx canister call hackathon addStake '(20, 10)'
dfx canister call hackathon addStake '(5, 10)'
dfx canister call hackathon addStake '(30, 10)'

dfx canister call hackathon listAllStakes