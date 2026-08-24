import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { ForgejoProcessCommand } from "../src/index.js"
import { forgejoConfigurationSave, forgejoRepositoryContextResolve } from "../src/index.js"

type RemoteMap = Record<string, string>

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

function executeCreate(remotes: RemoteMap) {
  return async ({ args }: ForgejoProcessCommand) => {
    if (args[0] === "remote" && args.length === 1) {
      return { success: true as const, data: Object.keys(remotes).join("\n") }
    }
    const name = args[2]
    const url = name === undefined ? undefined : remotes[name]
    return url === undefined
      ? { success: false as const, op: "test", errorMessage: "missing remote" }
      : { success: true as const, data: url }
  }
}

test("resolves an explicit repository and host without inspecting Git", async () => {
  const result = await forgejoRepositoryContextResolve({
    repository: "owner/repository",
    host: "https://forgejo.example.test/forgejo",
    execute: async () => {
      throw new Error("Git should not be called")
    },
  })

  expect(result).toEqual({
    success: true,
    data: {
      baseUrl: "https://forgejo.example.test/forgejo/",
      host: "forgejo.example.test",
      repository: { host: "forgejo.example.test", owner: "owner", name: "repository" },
    },
  })
})

test("resolves an explicit remote URL and remote name", async () => {
  const explicit = await forgejoRepositoryContextResolve({
    remote: "https://forgejo.example.test/owner/repository.git",
  })
  expect(explicit.success && explicit.data.repository).toEqual({
    host: "forgejo.example.test",
    owner: "owner",
    name: "repository",
  })

  const named = await forgejoRepositoryContextResolve({
    remote: "origin",
    execute: executeCreate({ origin: "ssh://git@forgejo.example.test/owner/repository.git" }),
  })
  expect(named.success && named.data.remote?.repository).toEqual({ owner: "owner", name: "repository" })
})

test("selects a single remote and prefers upstream among multiple remotes", async () => {
  const single = await forgejoRepositoryContextResolve({
    execute: executeCreate({ origin: "https://forgejo.example.test/owner/single.git" }),
  })
  expect(single.success && single.data.repository.name).toBe("single")

  const upstream = await forgejoRepositoryContextResolve({
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/fork.git",
      upstream: "https://forgejo.example.test/owner/project.git",
    }),
  })
  expect(upstream.success && upstream.data.repository.name).toBe("project")
})

test("rejects multiple remotes when no preferred or upstream remote is available", async () => {
  const result = await forgejoRepositoryContextResolve({
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      mirror: "https://forgejo.example.test/owner/mirror.git",
    }),
  })

  expect(result.success).toBe(false)
  if (!result.success) expect(result.errorMessage).toContain("unique Forgejo Git remote")
})

test("selects a remote matching an explicit host and does not filter by fallback host", async () => {
  const explicitHost = await forgejoRepositoryContextResolve({
    host: "host-b.example.test",
    execute: executeCreate({
      origin: "https://host-a.example.test/owner/wrong.git",
      mirror: "https://host-b.example.test/owner/right.git",
    }),
  })
  expect(explicitHost.success && explicitHost.data.repository.name).toBe("right")

  const fallbackHost = await forgejoRepositoryContextResolve({
    env: { FJ_FALLBACK_HOST: "fallback.example.test" },
    execute: executeCreate({ origin: "https://other.example.test/owner/usable.git" }),
  })
  expect(fallbackHost.success && fallbackHost.data.host).toBe("other.example.test")
})

test("uses the environment host after explicit input and before Git discovery", async () => {
  const environmentHost = await forgejoRepositoryContextResolve({
    env: { FJ_HOST: "host-b.example.test" },
    execute: executeCreate({
      origin: "https://host-a.example.test/owner/wrong.git",
      mirror: "https://host-b.example.test/owner/right.git",
    }),
  })
  expect(environmentHost.success && environmentHost.data.repository.name).toBe("right")

  const explicitHost = await forgejoRepositoryContextResolve({
    host: "host-a.example.test",
    env: { FJ_HOST: "host-b.example.test" },
    execute: executeCreate({ origin: "https://host-a.example.test/owner/explicit.git" }),
  })
  expect(explicitHost.success && explicitHost.data.repository.name).toBe("explicit")
})

test("treats a compatible force-host alias as authoritative over Git remotes", async () => {
  const result = await forgejoRepositoryContextResolve({
    env: { FORGEJO_HOST: "host-b.example.test" },
    execute: executeCreate({
      origin: "https://host-a.example.test/owner/wrong.git",
      mirror: "https://host-b.example.test/owner/right.git",
    }),
  })

  expect(result.success && result.data.repository.name).toBe("right")
})

test("keeps an explicit repository ahead of organization, remote, and directory defaults", async () => {
  const result = await forgejoRepositoryContextResolve({
    repository: "explicit-owner/explicit-repository",
    host: "https://forgejo.example.test",
    cwd: "/work/directory-repository",
    env: { FJ_ORG: "environment-owner", FJ_REMOTE: "origin" },
    execute: async () => {
      throw new Error("Git should not be called for an explicit repository")
    },
  })

  expect(result.success && result.data.repository).toEqual({
    host: "forgejo.example.test",
    owner: "explicit-owner",
    name: "explicit-repository",
  })
})

test("uses the preferred environment remote unless an explicit remote is provided", async () => {
  const preferred = await forgejoRepositoryContextResolve({
    env: { FJ_REMOTE: "mirror" },
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      mirror: "https://forgejo.example.test/owner/mirror.git",
    }),
  })
  expect(preferred.success && preferred.data.repository.name).toBe("mirror")

  const explicit = await forgejoRepositoryContextResolve({
    remote: "origin",
    env: { FJ_REMOTE: "mirror" },
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      mirror: "https://forgejo.example.test/owner/mirror.git",
    }),
  })
  expect(explicit.success && explicit.data.repository.name).toBe("origin")
})

test("uses the remote precedence explicit, environment, persisted, then automatic", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-context-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_remote: "mirror" }, { path })
  const execute = executeCreate({
    origin: "https://forgejo.example.test/owner/origin.git",
    mirror: "https://forgejo.example.test/owner/mirror.git",
  })

  const persisted = await forgejoRepositoryContextResolve({
    env: { FORGEJO_CONFIG_FILE: path },
    execute,
  })
  const environment = await forgejoRepositoryContextResolve({
    env: { FORGEJO_CONFIG_FILE: path, FJ_REMOTE: "origin" },
    execute,
  })
  const explicit = await forgejoRepositoryContextResolve({
    remote: "mirror",
    env: { FORGEJO_CONFIG_FILE: path, FJ_REMOTE: "origin" },
    execute,
  })

  expect(persisted.success && persisted.data.repository.name).toBe("mirror")
  expect(environment.success && environment.data.repository.name).toBe("origin")
  expect(explicit.success && explicit.data.repository.name).toBe("mirror")
})

test("ignores blank environment host and remote defaults", async () => {
  const result = await forgejoRepositoryContextResolve({
    env: { FJ_HOST: "  ", FJ_REMOTE: "\t" },
    execute: executeCreate({
      origin: "https://forgejo.example.test/owner/origin.git",
      upstream: "https://forgejo.example.test/owner/upstream.git",
    }),
  })

  expect(result.success && result.data.repository.name).toBe("upstream")
})

test("falls back from a blank primary host to FJ_FALLBACK_HOST", async () => {
  const result = await forgejoRepositoryContextResolve({
    cwd: "/work/current-repository",
    env: { FJ_HOST: "  ", FJ_FALLBACK_HOST: "fallback.example.test", FJ_ORG: "team" },
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })

  expect(result.success && result.data).toMatchObject({
    baseUrl: "https://fallback.example.test/",
    host: "fallback.example.test",
    repository: { owner: "team", name: "current-repository" },
  })
})

test("uses a persisted host only after Git remote discovery is unavailable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-context-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_host: "persisted.example.test" }, { path })

  const result = await forgejoRepositoryContextResolve({
    repository: "owner/repository",
    cwd: directory,
    env: { FORGEJO_CONFIG_FILE: path },
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })

  expect(result.success && result.data).toMatchObject({
    baseUrl: "https://persisted.example.test/",
    host: "persisted.example.test",
    repository: { owner: "owner", name: "repository" },
  })
})

test("lets a usable Git remote host defeat fallback and persisted hosts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-context-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_host: "persisted.example.test" }, { path })

  const result = await forgejoRepositoryContextResolve({
    cwd: directory,
    env: { FORGEJO_CONFIG_FILE: path, FJ_FALLBACK_HOST: "fallback.example.test" },
    execute: executeCreate({ origin: "https://remote.example.test/owner/repository.git" }),
  })

  expect(result.success && result.data.host).toBe("remote.example.test")
})

test("rejects a Git remote that conflicts with an environment-selected host", async () => {
  const result = await forgejoRepositoryContextResolve({
    remote: "https://remote.example.test/owner/repository.git",
    env: { FJ_HOST: "environment.example.test" },
  })

  expect(result.success).toBe(false)
  if (!result.success) expect(result.errorMessage).toContain("does not match")
})

test("uses a usable Git remote when FJ_REMOTE names an unavailable remote", async () => {
  const result = await forgejoRepositoryContextResolve({
    cwd: "/work/current-repository",
    env: { FJ_HOST: "forgejo.example.test", FJ_ORG: "team", FJ_REMOTE: "missing" },
    execute: executeCreate({ origin: "https://forgejo.example.test/remote-owner/remote.git" }),
  })

  expect(result.success && result.data.repository).toEqual({
    host: "forgejo.example.test",
    owner: "remote-owner",
    name: "remote",
  })
})

test("uses the configured organization and current directory after Git discovery is unavailable", async () => {
  const result = await forgejoRepositoryContextResolve({
    cwd: "/work/current-repository",
    env: { FJ_HOST: "forgejo.example.test", FJ_ORG: "team" },
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })

  expect(result).toEqual({
    success: true,
    data: {
      baseUrl: "https://forgejo.example.test/",
      host: "forgejo.example.test",
      repository: { host: "forgejo.example.test", owner: "team", name: "current-repository" },
    },
  })
})

test("uses persisted organization only after Git remote discovery", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-context-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_org: "persisted-team" }, { path })
  const environment = { FORGEJO_CONFIG_FILE: path, FJ_HOST: "forgejo.example.test" }

  const remote = await forgejoRepositoryContextResolve({
    cwd: directory,
    env: environment,
    execute: executeCreate({ origin: "https://forgejo.example.test/remote-owner/remote.git" }),
  })
  const persisted = await forgejoRepositoryContextResolve({
    cwd: directory,
    env: environment,
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })
  const environmentOverride = await forgejoRepositoryContextResolve({
    cwd: directory,
    env: { ...environment, FJ_ORG: "environment-team" },
    execute: async () => ({ success: false as const, op: "test", errorMessage: "not a Git repository" }),
  })

  expect(remote.success && remote.data.repository).toMatchObject({ owner: "remote-owner", name: "remote" })
  expect(persisted.success && persisted.data.repository).toMatchObject({
    owner: "persisted-team",
    name: directory.split("/").at(-1),
  })
  expect(environmentOverride.success && environmentOverride.data.repository).toMatchObject({
    owner: "environment-team",
    name: directory.split("/").at(-1),
  })
})

test("prefers a usable Git remote over the current directory fallback", async () => {
  const result = await forgejoRepositoryContextResolve({
    cwd: "/work/current-repository",
    env: { FJ_HOST: "forgejo.example.test", FJ_ORG: "team" },
    execute: executeCreate({ origin: "https://forgejo.example.test/remote-owner/remote.git" }),
  })

  expect(result.success && result.data.repository).toEqual({
    host: "forgejo.example.test",
    owner: "remote-owner",
    name: "remote",
  })
})
