import { readFileSync } from "node:fs";

const example = readFileSync(".env.example", "utf8")
  .split("\n")
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split("=")[0]);

console.log(`JobOS expects ${example.length} environment variables in .env.example.`);

