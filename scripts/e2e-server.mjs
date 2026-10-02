import { spawn } from "node:child_process";

const root = process.cwd();
const webPort = process.env.E2E_WEB_PORT ?? "3000";
const apiPort = process.env.E2E_API_PORT ?? "4000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${apiPort}`;
const databaseUrl = process.env.E2E_DATABASE_URL ?? "postgres://jobos:jobos@localhost:5432/jobos_e2e";

const env = {
  ...process.env,
  API_PORT: apiPort,
  PORT: webPort,
  WEB_PORT: webPort,
  DATABASE_URL: databaseUrl,
  E2E_DATABASE_URL: databaseUrl,
  NEXT_PUBLIC_API_URL: apiUrl,
  COREPACK_HOME: process.env.COREPACK_HOME ?? `${root}/.corepack`,
  PNPM_HOME: process.env.PNPM_HOME ?? `${root}/.pnpm-home`,
  npm_config_store_dir: process.env.npm_config_store_dir ?? `${root}/.pnpm-store`
};

const children = new Set();

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      shell: false,
      stdio: "inherit",
      ...options
    });
    children.add(child);
    child.on("exit", (code) => {
      children.delete(child);
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

function start(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env,
    shell: false,
    stdio: "inherit"
  });
  children.add(child);
  child.on("exit", (code) => {
    children.delete(child);
    if (!shuttingDown) {
      console.error(`${command} ${args.join(" ")} exited with ${code}`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

let shuttingDown = false;

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  await run("docker", ["compose", "up", "-d", "postgres", "redis"]);
  await run("node", ["scripts/e2e-ensure-db.mjs"]);
  await run("pnpm", ["db:migrate"]);
  await run("pnpm", ["test:e2e:reset"]);
  start("pnpm", ["--filter", "@jobos/api", "dev"]);
  await waitForUrl(`${apiUrl}/health`);
  start("pnpm", ["--filter", "@jobos/web", "dev"]);
} catch (error) {
  console.error(error);
  shutdown(1);
}
