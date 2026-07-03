import { execa } from "execa";
import getPort from "get-port";

export interface StartedServer {
  process: ReturnType<typeof execa>;
  url: string;
}

export async function startDevServer(command: string[], cwd: string, timeoutMs = 30000): Promise<StartedServer | undefined> {
  const port = await getPort();
  const child = execa(command[0] ?? "", command.slice(1), {
    cwd,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    reject: false
  });

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(url).catch(() => undefined);
    if (response?.ok) return { process: child, url };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  child.kill("SIGTERM");
  return undefined;
}
