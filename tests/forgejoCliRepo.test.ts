import { expect, test } from "bun:test"
import { createResult, createResultError } from "#result"
import type { ForgejoFetch } from "../src/http/forgejoRestTransportCreate.js"
import type { ForgejoProcessCommand } from "../src/index.js"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"

const env = { FORGEJO_TOKEN: "test-token" }

function outputCapture() {
  const output: string[] = []
  return {
    output,
    outputWrite: (value: string) => {
      output.push(value)
      return createResult(null)
    },
  }
}

test("runs repo view through explicit repository and host context with JSON output", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo", description: "A demo repository" }), {
      status: 200,
    })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "view", "owner/demo"],
    {
      env,
      fetch,
      execute: async () => {
        throw new Error("explicit repository context must not inspect Git")
      },
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual(["https://forgejo.example.test/api/v1/repos/owner/demo"])
  expect(JSON.parse(capture.output.join(""))).toMatchObject({ full_name: "owner/demo" })
})

test("resolves CLI host defaults in order and lets --host win", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo" }), { status: 200 })
  }

  const environment = { ...env, FJ_HOST: "primary.example.test", FJ_FALLBACK_HOST: "fallback.example.test" }
  const primary = await forgejoCliRun(["repo", "view", "owner/demo"], {
    env: environment,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const explicit = await forgejoCliRun(["--host", "explicit.example.test", "repo", "view", "owner/demo"], {
    env: environment,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const fallback = await forgejoCliRun(["repo", "view", "owner/demo"], {
    env: { ...environment, FJ_HOST: "  " },
    fetch,
    outputWrite: outputCapture().outputWrite,
  })

  expect(primary.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(fallback.success).toBe(true)
  expect(requests).toEqual([
    "https://primary.example.test/api/v1/repos/owner/demo",
    "https://explicit.example.test/api/v1/repos/owner/demo",
    "https://fallback.example.test/api/v1/repos/owner/demo",
  ])
})

test("selects FJ_REMOTE in the CLI while an explicit --remote takes precedence", async () => {
  const requests: string[] = []
  const remotes: Record<string, string> = {
    origin: "https://forgejo.example.test/owner/origin.git",
    mirror: "https://forgejo.example.test/owner/mirror.git",
  }
  const execute = async ({ args }: ForgejoProcessCommand) => {
    if (args[0] === "remote" && args.length === 1) return createResult(Object.keys(remotes).join("\n"))
    const url = remotes[args[2] ?? ""]
    return url === undefined ? createResultError("test", "missing remote") : createResult(url)
  }
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/repository", name: "repository" }), { status: 200 })
  }

  const preferred = await forgejoCliRun(["repo", "view"], {
    env: { ...env, FJ_REMOTE: "mirror" },
    execute,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const explicit = await forgejoCliRun(["repo", "view", "--remote", "origin"], {
    env: { ...env, FJ_REMOTE: "mirror" },
    execute,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })

  expect(preferred.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/repos/owner/mirror",
    "https://forgejo.example.test/api/v1/repos/owner/origin",
  ])
})

test("uses FJ_ORG for omitted repository-owner targets and preserves explicit organization", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ name: "demo", full_name: "team/demo" }), { status: 201 })
  }
  const environment = { ...env, FJ_ORG: "team" }

  const defaulted = await forgejoCliRun(["--host", "https://forgejo.example.test", "repo", "create", "demo"], {
    env: environment,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const explicit = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--organization", "explicit"],
    {
      env: environment,
      fetch,
      outputWrite: outputCapture().outputWrite,
    },
  )

  expect(defaulted.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/orgs/team/repos",
    "https://forgejo.example.test/api/v1/orgs/explicit/repos",
  ])
})

test("uses FJ_SSH_BASE for repository creation remotes", async () => {
  const commands: { command: string; args: readonly string[] }[] = []
  const result = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--remote", "origin", "--ssh"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch: async () =>
        new Response(
          JSON.stringify({
            name: "demo",
            full_name: "team/demo",
            clone_url: "https://forgejo.example.test/team/demo.git",
            ssh_url: "ssh://git@forgejo.example.test/team/demo.git",
          }),
          { status: 201 },
        ),
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: outputCapture().outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(commands).toEqual([
    {
      command: "git",
      args: ["remote", "add", "origin", "ssh://git@ssh.git.contentoren.de:2222/team/demo.git"],
    },
  ])
})

test("keeps omitted repository targets available for runtime fallback resolution", () => {
  const view = forgejoCliParse(["repo", "view"], { stdoutIsTty: false })
  expect(view.success).toBe(true)
  if (view.success) expect(view.data).toMatchObject({ kind: "repo-view", repository: undefined })

  const create = forgejoCliParse(["repo", "create", "demo"], { stdoutIsTty: false })
  expect(create.success).toBe(true)
  if (create.success) expect(create.data).toMatchObject({ kind: "repo-create", organization: undefined })
})

test("requires destructive confirmation in non-interactive mode and accepts --force", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(null, { status: 204 })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "delete", "--force", "owner/demo"],
    {
      env,
      fetch,
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual(["https://forgejo.example.test/api/v1/repos/owner/demo"])
  expect(JSON.parse(capture.output.join(""))).toEqual({ deleted: true, repository: "owner/demo" })
})

test("uses injectable local process and browser behavior for clone and browse", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(
      JSON.stringify({
        full_name: "owner/demo",
        name: "demo",
        clone_url: "https://forgejo.example.test/owner/demo.git",
        ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
        parent: {
          clone_url: "https://forgejo.example.test/upstream/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/upstream/demo.git",
        },
      }),
      { status: 200 },
    )
  }
  const commands: { command: string; args: readonly string[] }[] = []
  const capture = outputCapture()
  const clone = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "-I", "/tmp/key", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(clone.success).toBe(true)
  expect(commands).toEqual([
    {
      command: "git",
      args: [
        "clone",
        "-c",
        "core.sshCommand=ssh -i /tmp/key",
        "ssh://git@ssh.git.contentoren.de:2222/owner/demo.git",
        "/tmp/demo",
      ],
    },
    {
      command: "git",
      args: ["remote", "add", "upstream", "ssh://git@ssh.git.contentoren.de:2222/upstream/demo.git"],
    },
  ])

  commands.length = 0
  const defaultSsh = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(defaultSsh.success).toBe(true)
  expect(commands).toEqual([
    { command: "git", args: ["clone", "https://forgejo.example.test/owner/demo.git", "/tmp/demo"] },
    {
      command: "git",
      args: ["remote", "add", "upstream", "https://forgejo.example.test/upstream/demo.git"],
    },
  ])

  commands.length = 0
  const noSsh = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--no-ssh", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(noSsh.success).toBe(true)
  expect(commands).toEqual([
    { command: "git", args: ["clone", "https://forgejo.example.test/owner/demo.git", "/tmp/demo"] },
    {
      command: "git",
      args: ["remote", "add", "upstream", "https://forgejo.example.test/upstream/demo.git"],
    },
  ])

  let opened = ""
  const browse = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "browse", "owner/demo"],
    {
      env,
      fetch,
      browserOpen: async (url) => {
        opened = url
        return createResult(null)
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(browse.success).toBe(true)
  expect(opened).toBe("https://forgejo.example.test/owner/demo")
  expect(requests).toHaveLength(3)
})

test("parses repository status lists and pull-request unit options", () => {
  const status = forgejoCliParse(["--host", "forgejo.example.test", "repo", "star-status", "--list"], {
    stdoutIsTty: false,
  })
  expect(status.success).toBe(true)
  if (status.success)
    expect(status.data).toMatchObject({ kind: "repo-star-status", list: true, host: "forgejo.example.test" })

  const units = forgejoCliParse(
    ["repo", "units", "owner/demo", "prs", "--allow-rebase", "false", "--default-merge-style", "squash"],
    { stdoutIsTty: false },
  )
  expect(units.success).toBe(true)
  if (units.success)
    expect(units.data).toMatchObject({
      kind: "repo-units",
      repository: "owner/demo",
      unit: "prs",
      options: { allowRebase: false, defaultMergeStyle: "squash" },
    })
})

test("parses repository avatar options and rejects mutually exclusive operations", () => {
  const upload = forgejoCliParse(["repo", "edit", "owner/demo", "-A", "avatar.png"], { stdoutIsTty: false })
  expect(upload).toEqual({
    success: true,
    data: {
      kind: "repo-edit",
      repository: "owner/demo",
      options: { avatar: "avatar.png" },
      remote: undefined,
      host: undefined,
      cwd: undefined,
      style: "minimal",
    },
  })

  const conflict = forgejoCliParse(["repo", "edit", "owner/demo", "--avatar", "avatar.png", "--unset-avatar"], {
    stdoutIsTty: false,
  })
  expect(conflict.success).toBe(false)
  if (!conflict.success) expect(conflict.errorMessage).toContain("cannot be used with --unset-avatar")
})

test("uploads a repository avatar with injectable binary file reading and Forgejo base64 JSON", async () => {
  const requests: { method: string; path: string; body?: unknown }[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    const url = new URL(String(input))
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
    requests.push({ method: init?.method ?? "GET", path: url.pathname, ...(body === undefined ? {} : { body }) })
    if (init?.method === "POST") return new Response(null, { status: 204 })
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo" }), { status: 200 })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    [
      "--json",
      "--host",
      "https://forgejo.example.test",
      "repo",
      "edit",
      "owner/demo",
      "--description",
      "Demo",
      "--avatar",
      "avatar.png",
    ],
    {
      env,
      fetch,
      fileRead: async (path, encoding) => {
        expect(path).toBe("avatar.png")
        expect(encoding).toBe("binary")
        return createResult(new Uint8Array([0, 1, 255]))
      },
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual([
    { method: "PATCH", path: "/api/v1/repos/owner/demo", body: { description: "Demo" } },
    { method: "POST", path: "/api/v1/repos/owner/demo/avatar", body: { image: "AAH/" } },
  ])
  expect(JSON.parse(capture.output.join(""))).toMatchObject({ full_name: "owner/demo" })
})

test("unsets a repository avatar and reports injected file read errors usefully", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    requests.push(`${init?.method ?? "GET"} ${String(input)}`)
    return new Response(null, { status: 204 })
  }
  const unset = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "edit", "owner/demo", "--unset-avatar"],
    { env, fetch, outputWrite: outputCapture().outputWrite },
  )
  expect(unset.success).toBe(true)
  expect(requests).toEqual(["DELETE https://forgejo.example.test/api/v1/repos/owner/demo/avatar"])

  const missing = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "edit", "owner/demo", "--avatar", "missing.png"],
    {
      env,
      fetch,
      fileRead: async () => createResultError("testFileRead", "No such file"),
      outputWrite: outputCapture().outputWrite,
    },
  )
  expect(missing.success).toBe(false)
  if (!missing.success) expect(missing.errorMessage).toContain("Unable to read avatar file 'missing.png': No such file")
})
