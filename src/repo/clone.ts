import { execa } from "execa";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

function isRemoteRepo(repoRef: string): boolean {
  return /^https?:\/\//.test(repoRef) || /^git@/.test(repoRef);
}

export async function cloneRepo(repoRef: string, workspaceDir: string): Promise<{ repoDir: string; commitSha?: string }> {
  await fs.ensureDir(workspaceDir);
  const sourceDir = path.resolve(repoRef);
  const defaultRepoDir = path.join(workspaceDir, "repo");
  const repoDir = !isRemoteRepo(repoRef) && path.resolve(defaultRepoDir).startsWith(`${sourceDir}${path.sep}`)
    ? path.join(os.tmpdir(), `cookiedough-local-${Date.now()}`, "repo")
    : defaultRepoDir;
  await fs.remove(repoDir);

  if (isRemoteRepo(repoRef)) {
    await execa("git", ["clone", "--depth", "1", repoRef, repoDir]);
  } else {
    await fs.copy(path.resolve(repoRef), repoDir, {
      filter: (src) => !/node_modules|\.git|dist|\.next|\.cookiedough-runs/.test(src)
    });
  }

  const commit = await execa("git", ["rev-parse", "HEAD"], { cwd: isRemoteRepo(repoRef) ? repoDir : path.resolve(repoRef) }).catch(() => undefined);
  return { repoDir, commitSha: commit?.stdout.trim() };
}
