
echo $(dfx canister call hackathon listAllStakes)

echo $(dfx canister call hackathon drawStakes '(1632412666, 5)')

dfx identity use anonymous
dfx canister call hackathon registerStaker "iw4mSYWgilQHkpGXFeTRPJiXhUlko7r5y9pTOIaZmUw="
dfx canister call hackathon addStake '(10, 10)'
dfx canister call hackathon addStake '(20, 10)'
dfx canister call hackathon addStake '(5, 10)'
dfx canister call hackathon addStake '(30, 10)'
dfx use identity default

echo $(dfx canister call hackathon listAllStakes)

echo $(dfx canister call hackathon drawStakes '(1666540666, 5)')

echo $(dfx canister call hackathon drawStakes '(1632412666, 5)')
