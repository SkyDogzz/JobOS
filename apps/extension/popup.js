const apiUrlInput = document.querySelector("#apiUrl");
const tokenInput = document.querySelector("#token");
const saveButton = document.querySelector("#savePage");
const statusText = document.querySelector("#status");

void chrome.storage.sync.get(["apiUrl", "token"]).then((settings) => {
  apiUrlInput.value = settings.apiUrl ?? "http://localhost:4000";
  tokenInput.value = settings.token ?? "jobos-dev-extension-token";
});

saveButton.addEventListener("click", async () => {
  statusText.textContent = "Capturing page...";
  const apiUrl = apiUrlInput.value.replace(/\/$/, "");
  const token = tokenInput.value;
  await chrome.storage.sync.set({ apiUrl, token });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusText.textContent = "No active tab found.";
    return;
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  const response = await fetch(`${apiUrl}/jobs/import`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(result)
  });

  if (!response.ok) {
    statusText.textContent = `Import failed: ${response.status}`;
    return;
  }

  const body = await response.json();
  statusText.textContent = body.status === "updated" ? "Updated existing JobOS job." : "Saved to JobOS.";
});
