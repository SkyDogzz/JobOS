import { spawn } from "node:child_process";

const composeFile = "docker-compose.prod.yml";
const apiHostPort = process.env.API_HOST_PORT ?? "4100";
const webHostPort = process.env.WEB_HOST_PORT ?? "3100";
const env = {
  ...process.env,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? "jobos-prod-smoke-password",
  EXTENSION_IMPORT_TOKEN: process.env.EXTENSION_IMPORT_TOKEN ?? "jobos-dev-extension-token",
  COMPOSE_PROJECT_NAME: process.env.COMPOSE_PROJECT_NAME ?? "jobos_prod_smoke",
  API_HOST_PORT: apiHostPort,
  WEB_HOST_PORT: webHostPort,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${apiHostPort}`,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? "10000",
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ?? "60000"
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
      ...options
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function waitFor(url, label) {
  const timeoutAt = Date.now() + 120_000;
  let lastError;
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`${label} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`${label} did not become healthy: ${lastError instanceof Error ? lastError.message : lastError}`);
}

async function main() {
  let started = false;
  try {
    await run("docker", ["compose", "-f", composeFile, "build"]);
    await run("docker", ["compose", "-f", composeFile, "up", "-d"]);
    started = true;
    await waitFor(`http://localhost:${apiHostPort}/health`, "API");
    await run("docker", ["compose", "-f", composeFile, "exec", "-T", "api", "pnpm", "--filter", "@jobos/database", "db:migrate"]);
    await run("pnpm", ["test:api"], { env: { ...env, API_URL: `http://localhost:${apiHostPort}` } });
    await waitFor(`http://localhost:${webHostPort}`, "Web");
    console.log("Production stack smoke passed.");
  } catch (error) {
    if (started) {
      await run("docker", ["compose", "-f", composeFile, "logs", "--tail=150", "api", "web"]);
    }
    throw error;
  } finally {
    if (started) {
      await run("docker", ["compose", "-f", composeFile, "down"]);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
