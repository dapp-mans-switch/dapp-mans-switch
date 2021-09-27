import { hackathon } from "../../declarations/hackathon";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with hackathon actor, calling the greet method
  const greeting = await hackathon.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
