import { spawn } from "node:child_process";

const env = {
  ...process.env,
  COREPACK_HOME: process.env.COREPACK_HOME ?? `${process.cwd()}/.corepack`,
  PNPM_HOME: process.env.PNPM_HOME ?? `${process.cwd()}/.pnpm-home`,
  npm_config_store_dir: process.env.npm_config_store_dir ?? `${process.cwd()}/.pnpm-store`
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env,
      ...options
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

async function main() {
  await run("docker", ["compose", "up", "-d", "postgres", "redis"]);
  await run("pnpm", ["db:migrate"]);
  await run("pnpm", ["dev"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

