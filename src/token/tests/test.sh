#!/bin/sh

check() {
    if [ "$2" = "$3" ]; then
        echo "\033[0;32mOK\033[0m: ${1}"
    else
        echo "\033[0;31mNOK\033[0m: ${1}"
        echo "     Expected ${3}, got ${2}."
        dfx -q stop
        exit 1
    fi
}

dfx -q start --background --clean

dfx -q identity new "user"
dfx -q identity use "user"
p1="$(dfx identity get-principal)"

dfx -q identity new "admin"
dfx -q identity use "admin"
p0="$(dfx identity get-principal)"

dfx -q deploy --no-wallet --argument "(
    \"Aviate Token\",
    \"AV8\",
    8, 100
)"

echo ""

check "Initial supply." \
      "$(dfx canister call token totalSupply "()")" \
      "(100 : nat)"
check "Check inital balance." \
      "$(dfx canister call token balanceOf "(principal \"${p0}\")")" \
      "(100 : nat)"

check "Transfer 10 tokens." \
      "$(dfx canister call token transfer "(principal \"${p1}\", 10, null)")" \
      "(true)"

check "Check remaining balance." \
      "$(dfx canister call token balanceOf "(principal \"${p0}\")")" \
      "(90 : nat)"
check "Check if tokens arrived." \
      "$(dfx canister call token balanceOf "(principal \"${p1}\")")" \
      "(10 : nat)"

check "Approve to withdraw 40." \
      "$(dfx canister call token approve "(principal \"${p1}\", 40, null)")" \
      "(true)"
check "Check allowance." \
      "$(dfx canister call token allowance "(principal \"${p0}\", principal \"${p1}\")")" \
      "(40 : nat)"

dfx -q identity use "user"
check "Transfer 40 tokens with allowance." \
      "$(dfx canister call token transferFrom "(principal \"${p0}\", principal \"${p1}\", 40, null)")" \
      "(true)"
check "Check allowance." \
      "$(dfx canister call token allowance "(principal \"${p0}\", principal \"${p1}\")")" \
      "(0 : nat)"
check "Check balance." \
      "$(dfx canister call token balanceOf "(principal \"${p1}\")")" \
      "(50 : nat)"

echo ""

dfx -q stop
