import { hackathon } from "../../declarations/hackathon";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with hackathon actor, calling the greet method
  const greeting = await hackathon.greet(name);

  document.getElementById("greeting").innerText = greeting;
});

// show and hide form to add/edit stakes
document.getElementById("staker_button").addEventListener("click", async () => {
  const show_form = document.getElementById("staker_form").style.display.toString();
  if (show_form == "none") {
    document.getElementById("staker_form").style.display = "";
  } else {
    document.getElementById("staker_form").style.display = "none";
  }
});

document.getElementById("add_new_stake_button").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("amount").value);
  const duration = parseInt(document.getElementById("duration").value);
  const new_staker_id = await hackathon.addStaker("Staker1", amount, duration);
  
  appendStakerTable();
});

// show all stakers
document.getElementById("show_stakes_button").addEventListener("click", async () => {
  appendStakerTable();
});

// build a new table containing all stakers and append to staker form
async function appendStakerTable() {
  const all_stakes = await hackathon.listAllStakers();
  
  var table = document.createElement("table");
  
  let col_names = ["name", "amount", "days"];
  // add header
  var tr = table.insertRow(-1);
  for (const cn of col_names) {
    var tabCell = tr.insertCell(-1);
    tabCell.innerHTML = cn
  }
  // add rows to table
  all_stakes.map(function (s) {
    var tr = table.insertRow(-1);
    for (const cn of col_names) {
      var tabCell = tr.insertCell(-1);
      tabCell.innerHTML = s[cn];
    }
  });
  document.getElementById("staker_form").appendChild(table)
}