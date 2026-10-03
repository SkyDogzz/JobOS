const apiUrlInput = document.querySelector("#apiUrl");
const tokenInput = document.querySelector("#token");
const previewButton = document.querySelector("#previewPage");
const saveButton = document.querySelector("#savePage");
const statusText = document.querySelector("#status");
const previewPanel = document.querySelector("#preview");
const duplicatePanel = document.querySelector("#duplicates");
const duplicateList = document.querySelector("#duplicateList");
const fields = {
  title: document.querySelector("#previewTitle"),
  company: document.querySelector("#previewCompany"),
  location: document.querySelector("#previewLocation"),
  salary: document.querySelector("#previewSalary")
};

let capturedPayload;

void chrome.storage.sync.get(["apiUrl", "token"]).then((settings) => {
  apiUrlInput.value = settings.apiUrl ?? "http://localhost:4000";
  tokenInput.value = settings.token ?? "jobos-dev-extension-token";
});

previewButton.addEventListener("click", async () => {
  await withBusy(previewButton, "Capturing page...", async () => {
    const settings = await saveSettings();
    capturedPayload = await captureActiveTab();
    const preview = await apiRequest(settings, "/jobs/import/preview", capturedPayload);
    renderPreview(preview);
    statusText.textContent = preview.status === "duplicate" ? "Review duplicate warning before saving." : "Ready to save.";
  });
});

saveButton.addEventListener("click", async () => {
  if (!capturedPayload) {
    statusText.textContent = "Preview a job page before saving.";
    return;
  }

  await withBusy(saveButton, "Saving to JobOS...", async () => {
    const settings = await saveSettings();
    const body = await apiRequest(settings, "/jobs/import", capturedPayload);
    statusText.textContent = body.status === "updated" ? "Updated existing JobOS job." : "Saved to JobOS.";
    renderPreview(body);
  });
});

async function saveSettings() {
  const apiUrl = apiUrlInput.value.replace(/\/$/, "");
  const token = tokenInput.value;
  await chrome.storage.sync.set({ apiUrl, token });
  return { apiUrl, token };
}

async function captureActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found.");

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
  return result;
}

async function apiRequest(settings, path, payload) {
  const response = await fetch(`${settings.apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const label = response.status === 401 ? "Check the import token." : `Request failed with ${response.status}.`;
    throw new Error(label);
  }

  return response.json();
}

function renderPreview(body) {
  const parsed = body.parsed ?? {};
  fields.title.textContent = parsed.title ?? "Untitled role";
  fields.company.textContent = parsed.companyName ?? "Not parsed";
  fields.location.textContent = parsed.location ?? "Not parsed";
  fields.salary.textContent = parsed.salaryText ?? "Not parsed";

  duplicateList.replaceChildren();
  for (const duplicate of body.duplicates ?? []) {
    const item = document.createElement("li");
    const reasons = duplicate.duplicateReasons?.length ? ` (${duplicate.duplicateReasons.join(", ")})` : "";
    item.textContent = `${duplicate.title} at ${duplicate.companyName ?? "Unknown company"} - ${duplicate.duplicateScore}%${reasons}`;
    duplicateList.append(item);
  }

  duplicatePanel.hidden = !body.duplicates?.length;
  previewPanel.hidden = false;
}

async function withBusy(button, message, callback) {
  try {
    statusText.textContent = message;
    button.disabled = true;
    await callback();
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Unexpected extension error.";
  } finally {
    button.disabled = false;
  }
}
