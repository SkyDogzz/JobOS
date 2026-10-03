import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";
const token = process.env.EXTENSION_IMPORT_TOKEN ?? "jobos-dev-extension-token";
const fixturesDir = new URL("../apps/extension/fixtures", import.meta.url);

async function request(path, options) {
  const response = await fetch(`${apiUrl}${path}`, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${body}`);
  }
  return response.json();
}

async function main() {
  try {
    await request("/health");
  } catch {
    console.log("Extension fixture smoke tests skipped: API is not running.");
    return;
  }

  for (const file of readdirSync(fixturesDir).filter((name) => name.endsWith(".json")).sort()) {
    const payload = JSON.parse(readFileSync(join(fixturesDir.pathname, file), "utf8"));
    const preview = await request("/jobs/import/preview", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!["ready", "duplicate"].includes(preview.status)) throw new Error(`${file} returned an invalid preview status.`);
    if (!preview.parsed?.title) throw new Error(`${file} preview did not parse a title.`);

    const first = await request("/jobs/import", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!["created", "updated"].includes(first.status)) throw new Error(`${file} returned an invalid import status.`);

    const second = await request("/jobs/import", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (second.status !== "updated") throw new Error(`${file} did not update on repeated source URL import.`);
    if (second.job.id !== first.job.id) throw new Error(`${file} repeated import created a duplicate job.`);

    const duplicatePreview = await request("/jobs/import/preview", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (duplicatePreview.status !== "duplicate") throw new Error(`${file} preview did not warn after import.`);
    if (duplicatePreview.duplicateCount < 1) throw new Error(`${file} preview did not return duplicate candidates.`);
  }

  console.log("Extension fixture smoke tests passed.");
}

void main();
