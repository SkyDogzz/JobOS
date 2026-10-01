import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

if (manifest.manifest_version !== 3) throw new Error("Extension must use Manifest V3.");
if (!manifest.action?.default_popup) throw new Error("Extension must define an action popup.");
if (!manifest.permissions.includes("storage")) throw new Error("Extension must request storage permission.");

console.log("Extension scaffold validated.");
