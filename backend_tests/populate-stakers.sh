#!/bin/bash

echo "Create stakers:"

dfx identity use anonymous
test_principal=$(dfx identity get-principal)
echo $test_principal
# oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==
dfx canister call hackathon registerStaker "+Jee1ZHe4ZtfhQr8dUuHlxhvkP0sH6Qu5WVeC0fBCe4="

dfx identity use default
default_principal=$(dfx identity get-principal)
echo $default_principal
# oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==
dfx canister call hackathon registerStaker "+Jee1ZHe4ZtfhQr8dUuHlxhvkP0sH6Qu5WVeC0fBCe4="


dfx canister call hackathon listAllStakers

echo "Create stakes:"

dfx identity use anonymous
dfx canister call token buyIn 200
dfx canister call token approve '(principal "rrkah-fqaaa-aaaaa-aaaaq-cai", 100, null)'
dfx canister call hackathon addStake '(100, 100)'
dfx canister call hackathon addStake '(100, 100)' # not enough allowance

dfx identity use default
dfx canister call token buyIn 10000
dfx canister call token approve '(principal "rrkah-fqaaa-aaaaa-aaaaq-cai", 100, null)'
dfx canister call hackathon addStake '(100, 100)' # 2


dfx canister call hackathon listAllStakes