import { expect, test } from "bun:test"
import { forgejoRepositoryContextResolve } from "../src/index.js"
import type { ForgejoProcessCommand } from "../src/index.js"

type RemoteMap = Record<string, string>

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

test("selects a remote matching an explicit or fallback host", async () => {
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
    execute: executeCreate({
      origin: "https://other.example.test/owner/wrong.git",
      mirror: "https://fallback.example.test/owner/right.git",
    }),
  })
  expect(fallbackHost.success && fallbackHost.data.host).toBe("fallback.example.test")
})
