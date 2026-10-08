import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const children = [
  spawn("npm", ["run", "dev", "-w", "@contextbridge/mcp-server"], { stdio: "inherit", shell: false }),
  spawn("npm", ["run", "dev", "-w", "@contextbridge/web"], { stdio: "inherit", shell: false })
];

const stop = () => { for (const child of children) child.kill("SIGTERM"); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", (code) => { if (code && code !== 0) process.exitCode = code; });
