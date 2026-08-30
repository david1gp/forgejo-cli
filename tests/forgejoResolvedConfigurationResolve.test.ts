import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ForgejoProcessCommand } from "../src/index.js"
import { forgejoConfigurationSave, forgejoResolvedConfigurationResolve } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

function executeCreate(remotes: Record<string, string>) {
  return async ({ args }: ForgejoProcessCommand) => {
    if (args[0] === "remote" && args.length === 1)
      return { success: true as const, data: Object.keys(remotes).join("\n") }
    const name = args[2]
    const url = name === undefined ? undefined : remotes[name]
    return url === undefined
      ? { success: false as const, op: "test", errorMessage: "missing remote" }
      : { success: true as const, data: url }
  }
}

test("reports the Git-selected host and remote with Git provenance and command precedence", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-resolved-git-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  const configurationPath = join(root, "config.json")
  await mkdir(cwd, { recursive: true })
  await forgejoConfigurationSave(
    { hosts: {}, default_host: "persisted.example.test", default_remote: "mirror" },
    { path: configurationPath },
  )

  const processSelected = await forgejoResolvedConfigurationResolve({
    cwd,
    env: { FORGEJO_CONFIG_FILE: configurationPath, FJ_HOST: "process.example.test", FJ_REMOTE: "origin" },
    execute: executeCreate({
      origin: "https://process.example.test/remote-owner/origin.git",
      mirror: "https://process.example.test/remote-owner/mirror.git",
    }),
  })
  expect(processSelected.success && processSelected.data.defaults).toMatchObject({
    host: { value: "process.example.test", source: "environment" },
    remote: { value: "origin", source: "git" },
  })

  const explicitSelected = await forgejoResolvedConfigurationResolve({
    cwd,
    host: "explicit.example.test",
    env: { FORGEJO_CONFIG_FILE: configurationPath, FJ_HOST: "process.example.test", FJ_REMOTE: "origin" },
    execute: executeCreate({
      origin: "https://process.example.test/remote-owner/origin.git",
      upstream: "https://explicit.example.test/remote-owner/upstream.git",
    }),
  })
  expect(explicitSelected.success && explicitSelected.data.defaults).toMatchObject({
    host: { value: "explicit.example.test", source: "cli" },
    remote: { value: "upstream", source: "git" },
  })

  const persistedSelected = await forgejoResolvedConfigurationResolve({
    cwd,
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    execute: executeCreate({
      origin: "https://remote.example.test/remote-owner/origin.git",
      mirror: "https://remote.example.test/remote-owner/mirror.git",
    }),
  })
  expect(persistedSelected.success && persistedSelected.data.defaults).toMatchObject({
    host: { value: "remote.example.test", source: "git" },
    remote: { value: "mirror", source: "git" },
  })
})

test("preserves resolved values when Git inspection fails outside a checkout", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-resolved-no-git-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  const configurationPath = join(root, "config.json")
  await mkdir(cwd, { recursive: true })
  await forgejoConfigurationSave(
    { hosts: {}, default_host: "persisted.example.test", default_remote: "persisted-remote" },
    { path: configurationPath },
  )

  const result = await forgejoResolvedConfigurationResolve({
    cwd,
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })

  expect(result.success && result.data.defaults).toMatchObject({
    host: { value: "persisted.example.test", source: "persisted" },
    remote: { value: "persisted-remote", source: "persisted" },
  })
})

test("reports the existing ambiguous Git remote error", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-resolved-ambiguous-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  const configurationPath = join(root, "config.json")
  await mkdir(cwd, { recursive: true })
  await forgejoConfigurationSave({ hosts: {} }, { path: configurationPath })

  const result = await forgejoResolvedConfigurationResolve({
    cwd,
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      mirror: "https://forgejo.example.test/owner/mirror.git",
    }),
  })

  expect(result.success).toBe(false)
  if (!result.success) expect(result.errorMessage).toContain("unique Forgejo Git remote")
})

test("uses the nearest dotenv remote preference for Git selection", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-resolved-dotenv-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  const configurationPath = join(root, "config.json")
  await mkdir(cwd, { recursive: true })
  await forgejoConfigurationSave({ hosts: {} }, { path: configurationPath })
  await writeFile(join(root, ".env"), "FJ_REMOTE=mirror\n")

  const result = await forgejoResolvedConfigurationResolve({
    cwd,
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      mirror: "https://forgejo.example.test/owner/mirror.git",
    }),
  })

  expect(result.success && result.data.defaults.remote).toEqual({ value: "mirror", source: "git" })
})
