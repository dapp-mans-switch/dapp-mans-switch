// get current balance, takes canisters object
export async function getBalance(canisters) {
    let balance = await canisters.token.myBalance()
    document.getElementById('balance').innerHTML = "Balance: " + balance + " $HRBT"
}

// top up balance, canisters are passed as well
async function buyTokens(n_tokens, canisters) {
    await canisters.token.buyIn(n_tokens)
    getBalance()
  }