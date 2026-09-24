/* global document */

const output = document.querySelector("#output");

async function load(url) {
  output.textContent = "Loading...";

  try {
    const response = await fetch(url);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body?.error?.message || "Request failed");
    }

    output.textContent = JSON.stringify(body, null, 2);
  } catch (error) {
    output.textContent = error.message;
  }
}

document
  .querySelector("#load-equipment")
  .addEventListener("click", () => load("/api/equipment"));

document
  .querySelector("#load-requests")
  .addEventListener("click", () => load("/api/requests"));
