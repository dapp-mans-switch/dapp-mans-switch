


dfx identity use anonymous
default_principal=$(dfx identity get-principal)
echo $default_principal

echo $(dfx canister call hackathon addStake '(10, 10)')

dfx identity use default
echo $(dfx canister call hackathon registerStaker "iw4mSYWgilQHkpGXFeTRPJiXhUlko7r5y9pTOIaZmUw=")
echo $(dfx canister call hackathon addStake '(10, 10)')
echo $(dfx canister call hackathon addStake '(10, 0)')

echo $(dfx canister call hackathon listMyStakes)