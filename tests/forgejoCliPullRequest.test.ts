import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createResult } from "#result"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"
import { forgejoConfigurationSave } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test("preserves pull request N and ^N parent references", () => {
  const current = forgejoCliParse(["pr", "view", "owner/repo#7", "body"], { stdoutIsTty: false })
  expect(current.success).toBe(true)
  if (current.success) expect(current.data).toMatchObject({ kind: "pr-view", pr: "owner/repo#7", view: "body" })

  const parent = forgejoCliParse(["pr", "checkout", "--repo", "owner/repo", "^7"], { stdoutIsTty: false })
  expect(parent.success).toBe(true)
  if (parent.success) expect(parent.data).toMatchObject({ kind: "pr-checkout", pr: "owner/repo#^7" })

  const diff = forgejoCliParse(["pr", "view", "owner/repo#^7", "diff", "--patch", "--editor"], {
    stdoutIsTty: false,
  })
  expect(diff.success).toBe(true)
  if (diff.success) expect(diff.data).toMatchObject({ kind: "pr-view", view: "diff", patch: true, editor: true })

  const commits = forgejoCliParse(["pr", "view", "owner/repo#7", "commits", "-o"], { stdoutIsTty: false })
  expect(commits.success).toBe(true)
  if (commits.success) expect(commits.data).toMatchObject({ kind: "pr-view", view: "commits", oneline: true })
})

test("views a pull request through the library and emits JSON", async () => {
  const output: string[] = []
  const result = await forgejoCliRun(["--json", "pr", "view", "forgejo.example.test/owner/repo#7"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch: async (input) => {
      expect(String(input)).toContain("/api/v1/repos/owner/repo/pulls/7")
      return new Response(
        JSON.stringify({
          number: 7,
          title: "A test pull request",
          body: "PR body",
          state: "open",
          user: { login: "author" },
          assignees: [],
          labels: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    },
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(result).toEqual({ success: true, data: 0 })
  expect(JSON.parse(output.join(""))).toMatchObject({ number: 7, title: "A test pull request" })
})

test("searches and creates pull requests through the existing resource APIs", async () => {
  const requests: Request[] = []
  const output: string[] = []
  const fetch = async (input: string | URL, init?: RequestInit) => {
    const request = new Request(String(input), init)
    requests.push(request)
    if (request.method === "POST")
      return new Response(JSON.stringify({ number: 8, title: "Created PR", state: "open" }), { status: 201 })
    return new Response(JSON.stringify([{ number: 7, title: "Found PR", state: "open" }]), { status: 200 })
  }
  const search = await forgejoCliRun(["--json", "pr", "search", "query", "--repo", "forgejo.example.test/owner/repo"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch,
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(search).toEqual({ success: true, data: 0 })
  expect(JSON.parse(output.pop() ?? "[]")).toMatchObject([{ number: 7 }])

  const created = await forgejoCliRun(
    [
      "--json",
      "pr",
      "create",
      "--repo",
      "forgejo.example.test/owner/repo",
      "--head",
      "feature",
      "--base",
      "main",
      "--title",
      "Created PR",
      "--body",
      "body",
    ],
    {
      env: { FORGEJO_TOKEN: "test-token" },
      fetch,
      outputWrite: (value) => {
        output.push(value)
        return createResult(null)
      },
    },
  )
  expect(created).toEqual({ success: true, data: 0 })
  expect(await requests.at(-1)?.json()).toEqual({ title: "Created PR", body: "body", base: "main", head: "feature" })
})

test("uses injected stdin for pull request comments", async () => {
  const requests: Request[] = []
  const output: string[] = []
  const result = await forgejoCliRun(["--json", "pr", "comment", "forgejo.example.test/owner/repo#7", "--stdin"], {
    env: { FORGEJO_TOKEN: "test-token" },
    stdinRead: async () => createResult("from stdin"),
    fetch: async (input, init) => {
      requests.push(new Request(String(input), init))
      return new Response(JSON.stringify({ id: 11, body: "from stdin", user: { login: "author" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    },
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(result).toEqual({ success: true, data: 0 })
  expect(await requests[0]?.json()).toEqual({ body: "from stdin" })
  expect(JSON.parse(output.join(""))).toMatchObject({ id: 11, body: "from stdin" })
})

test("checks out a pull request with injected Git execution", async () => {
  const commands: { command: string; args: readonly string[] }[] = []
  const result = await forgejoCliRun(
    ["-H", "https://forgejo.example.test", "pr", "checkout", "owner/repo#7", "--ssh", "--identity-file", "/tmp/key"],
    {
      env: {
        FORGEJO_TOKEN: "test-token",
        FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222",
      },
      fetch: async () =>
        new Response(
          JSON.stringify({
            clone_url: "https://forgejo.example.test/owner/repo.git",
            ssh_url: "git@forgejo.example.test:owner/repo.git",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      execute: async (input) => {
        commands.push(input)
        return createResult("")
      },
      outputWrite: () => createResult(null),
    },
  )
  expect(result).toEqual({ success: true, data: 0 })
  expect(commands.map((command) => command.args)).toEqual([
    ["status", "--porcelain"],
    [
      "fetch",
      "-c",
      "core.sshCommand=ssh -i /tmp/key",
      "ssh://git@ssh.git.contentoren.de:2222/owner/repo.git",
      "pull/7/head",
    ],
    ["checkout", "-B", "pr-owner-7", "FETCH_HEAD"],
  ])
})

test("uses persisted ssh_base for pull request checkout", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-pr-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    { hosts: {}, ssh_base: "ssh://git@persisted.example.test:2222" },
    { path: configurationPath },
  )
  const commands: string[][] = []
  const result = await forgejoCliRun(
    ["-H", "https://forgejo.example.test", "pr", "checkout", "owner/repo#7", "--ssh"],
    {
      env: { FORGEJO_TOKEN: "test-token", FORGEJO_CONFIG_FILE: configurationPath },
      fetch: async () =>
        new Response(
          JSON.stringify({
            clone_url: "https://forgejo.example.test/owner/repo.git",
            ssh_url: "git@forgejo.example.test:owner/repo.git",
          }),
          { status: 200 },
        ),
      execute: async (input) => {
        commands.push([...input.args])
        return createResult("")
      },
      outputWrite: () => createResult(null),
    },
  )

  expect(result.success).toBe(true)
  expect(commands).toEqual([
    ["status", "--porcelain"],
    ["fetch", "ssh://git@persisted.example.test:2222/owner/repo.git", "pull/7/head"],
    ["checkout", "-B", "pr-owner-7", "FETCH_HEAD"],
  ])
})

test("views pull request diffs with injectable editor and output effects", async () => {
  const output: string[] = []
  const warnings: string[] = []
  const editors: { initial: string; extension?: string }[] = []
  const result = await forgejoCliRun(
    ["pr", "view", "forgejo.example.test/owner/repo#^7", "diff", "--patch", "--editor"],
    {
      env: { FORGEJO_TOKEN: "test-token" },
      fetch: async (input) => {
        const url = new URL(String(input))
        if (url.pathname === "/api/v1/repos/owner/repo")
          return new Response(JSON.stringify({ parent: { full_name: "upstream/project" } }))
        expect(url.pathname).toBe("/api/v1/repos/upstream/project/pulls/7.patch")
        return new Response("patch content\n", { status: 200 })
      },
      editor: async (initial, extension) => {
        editors.push({ initial, extension })
        return createResult("edited patch\n")
      },
      outputWrite: (value) => {
        output.push(value)
        return createResult(null)
      },
      stderrWrite: (value) => {
        warnings.push(value)
        return createResult(null)
      },
    },
  )
  expect(result).toEqual({ success: true, data: 0 })
  expect(editors).toEqual([{ initial: "patch content\n", extension: "patch" }])
  expect(output).toEqual([])
  expect(warnings[0]).toContain("volatile")
})

test("renders pull request files and commits in human and JSON modes", async () => {
  const output: string[] = []
  const fetch = async (input: string | URL) => {
    const url = new URL(String(input))
    if (url.pathname.endsWith("/files"))
      return new Response(JSON.stringify([{ filename: "src/a.ts", additions: 2, deletions: 1 }]))
    return new Response(
      JSON.stringify([
        {
          sha: "abcdef1234567890",
          created: "2026-01-01T00:00:00Z",
          commit: { message: "First line\nDetails", author: { name: "Alice", email: "alice@example.test" } },
          stats: { additions: 3, deletions: 2 },
        },
      ]),
    )
  }
  const files = await forgejoCliRun(["pr", "view", "forgejo.example.test/owner/repo#7", "files"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch,
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(files).toEqual({ success: true, data: 0 })
  expect(output.join("")).toBe("+2 -1 src/a.ts\n")
  output.length = 0
  const commits = await forgejoCliRun(["pr", "view", "forgejo.example.test/owner/repo#7", "commits", "--oneline"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch,
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(commits).toEqual({ success: true, data: 0 })
  expect(output.join("")).toContain("abcdef1 +3 -2 First line\n")
})
