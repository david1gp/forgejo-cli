import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createResult } from "#result"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"
import type { ForgejoFetch } from "../src/http/forgejoRestTransportCreate.js"
import { forgejoConfigurationSave } from "../src/index.js"

const env = { FORGEJO_TOKEN: "test-token" }
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

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

test("parses wiki and actions command trees including repeated dispatch inputs", () => {
  const wiki = forgejoCliParse(["wiki", "clone", "--repo", "owner/demo", "--ssh", "--path", "/tmp/wiki"], {
    stdoutIsTty: false,
  })
  expect(wiki.success).toBe(true)
  if (wiki.success)
    expect(wiki.data).toMatchObject({ kind: "wiki-clone", repository: "owner/demo", ssh: true, path: "/tmp/wiki" })

  const actions = forgejoCliParse(
    ["actions", "dispatch", "build.yml", "main", "-I", "A=one=two", "--inputs", "B=two"],
    { stdoutIsTty: false },
  )
  expect(actions.success).toBe(true)
  if (actions.success)
    expect(actions.data).toMatchObject({ kind: "actions-dispatch", inputs: { A: "one=two", B: "two" } })
})

test("runs wiki view, clone, and browse with injectable process and browser effects", async () => {
  const calls: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    const url = String(input)
    calls.push(url)
    if (url.endsWith("/wiki/pages")) return new Response(JSON.stringify([{ title: "Home" }]))
    if (url.includes("/wiki/page/Home"))
      return new Response(
        JSON.stringify({
          title: "Home",
          content_base64: Buffer.from("# Hello\n").toString("base64"),
          html_url: "https://forgejo.example.test/owner/demo/wiki/Home",
        }),
      )
    return new Response(
      JSON.stringify({
        full_name: "owner/demo",
        name: "demo",
        clone_url: "https://forgejo.example.test/owner/demo.git",
        ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
      }),
    )
  }
  const capture = outputCapture()
  const commands: { command: string; args: string[] }[] = []
  const execute = async (input: { command: string; args: readonly string[] }) => {
    commands.push({ command: input.command, args: [...input.args] })
    return createResult("")
  }

  const contents = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "contents", "--repo", "owner/demo"],
    {
      env,
      fetch,
      outputWrite: capture.outputWrite,
    },
  )
  expect(contents.success).toBe(true)
  expect(capture.output.join("")).toBe("Home\n")

  const view = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "view", "Home", "--repo", "owner/demo"],
    {
      env,
      fetch,
      outputWrite: capture.outputWrite,
    },
  )
  expect(view.success).toBe(true)
  expect(capture.output.join("")).toContain("Home\n\n# Hello")

  const clone = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "clone", "--repo", "owner/demo", "--ssh", "/tmp/demo-wiki"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute,
      outputWrite: capture.outputWrite,
    },
  )
  expect(clone.success).toBe(true)
  expect(commands[0]?.args).toEqual([
    "clone",
    "ssh://git@ssh.git.contentoren.de:2222/owner/demo.wiki.git",
    "/tmp/demo-wiki",
  ])

  let opened = ""
  const browse = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "browse", "Home", "--repo", "owner/demo"],
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
  expect(opened).toContain("/wiki/Home")
  expect(calls.some((url) => url.endsWith("/wiki/pages"))).toBe(true)
})

test("uses persisted ssh_base for wiki clones", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-wiki-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    { hosts: {}, ssh_base: "ssh://git@persisted.example.test:2222" },
    { path: configurationPath },
  )
  const commands: string[][] = []
  const result = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "clone", "--repo", "owner/demo", "--ssh", "/tmp/wiki"],
    {
      env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
      fetch: async () =>
        new Response(
          JSON.stringify({
            full_name: "owner/demo",
            name: "demo",
            clone_url: "https://forgejo.example.test/owner/demo.git",
            ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
          }),
        ),
      execute: async (input) => {
        commands.push([...input.args])
        return createResult("")
      },
      outputWrite: () => createResult(null),
    },
  )

  expect(result.success).toBe(true)
  expect(commands).toEqual([["clone", "ssh://git@persisted.example.test:2222/owner/demo.wiki.git", "/tmp/wiki"]])
})

test("uses the configured SSH default for wiki clones and honors explicit HTTPS", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-wiki-ssh-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_ssh: ["forgejo.example.test"] }, { path: configurationPath })
  const commands: string[][] = []
  const options = {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
    fetch: async () =>
      new Response(
        JSON.stringify({
          full_name: "owner/demo",
          name: "demo",
          clone_url: "https://forgejo.example.test/owner/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
        }),
      ),
    execute: async (input: { args: readonly string[] }) => {
      commands.push([...input.args])
      return createResult("")
    },
    outputWrite: () => createResult(null),
  }

  const configuredDefault = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "clone", "--repo", "owner/demo", "/tmp/wiki"],
    options,
  )
  const explicitHttps = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "wiki", "clone", "--repo", "owner/demo", "--no-ssh", "/tmp/wiki"],
    options,
  )

  expect(configuredDefault.success).toBe(true)
  expect(explicitHttps.success).toBe(true)
  expect(commands).toEqual([
    ["clone", "ssh://git@forgejo.example.test/owner/demo.wiki.git", "/tmp/wiki"],
    ["clone", "https://forgejo.example.test/owner/demo.wiki.git", "/tmp/wiki"],
  ])
})

test("runs Actions tasks, variables, secrets, deletes with confirmation, and dispatch", async () => {
  const requests: { url: string; method: string; body?: unknown }[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
    requests.push({ url, method, ...(body === undefined ? {} : { body }) })
    if (url.endsWith("/actions/tasks?page=1&limit=20"))
      return new Response(
        JSON.stringify({ total_count: 1, workflow_runs: [{ run_number: 4, status: "success", name: "Build" }] }),
      )
    if (url.endsWith("/actions/variables") && method === "GET")
      return new Response(JSON.stringify([{ name: "GREETING", data: "hello" }]))
    if (url.endsWith("/actions/secrets") && method === "GET")
      return new Response(JSON.stringify([{ name: "TOKEN", created_at: "today" }]))
    return new Response(null, { status: 204 })
  }
  const capture = outputCapture()
  const common = { env, fetch, outputWrite: capture.outputWrite }
  const tasks = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "actions", "tasks", "--repo", "owner/demo"],
    common,
  )
  expect(tasks.success).toBe(true)
  expect(JSON.parse(capture.output.join(""))).toMatchObject({ total_count: 1 })

  capture.output.length = 0
  const variable = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "actions", "variables", "create", "--repo", "owner/demo", "NEW"],
    {
      ...common,
      editor: async () => createResult("from editor"),
    },
  )
  expect(variable.success).toBe(true)
  expect(
    requests.some(
      (request) =>
        request.method === "POST" && (request.body as Record<string, unknown> | undefined)?.value === "from editor",
    ),
  ).toBe(true)

  capture.output.length = 0
  const secrets = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "actions", "secrets", "list", "--repo", "owner/demo"],
    common,
  )
  expect(secrets.success).toBe(true)
  expect(JSON.parse(capture.output.join(""))).toEqual([{ name: "TOKEN", created_at: "today" }])

  let confirmed = ""
  const deleted = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "actions", "secrets", "delete", "--repo", "owner/demo", "TOKEN"],
    {
      ...common,
      confirm: async (message) => {
        confirmed = message
        return true
      },
    },
  )
  expect(deleted.success).toBe(true)
  expect(confirmed).toContain("TOKEN")

  capture.output.length = 0
  const dispatch = await forgejoCliRun(
    [
      "--json",
      "--host",
      "https://forgejo.example.test",
      "actions",
      "dispatch",
      "--repo",
      "owner/demo",
      "build.yml",
      "main",
      "-I",
      "A=one=two",
    ],
    common,
  )
  expect(dispatch.success).toBe(true)
  expect(requests.find((request) => request.url.endsWith("/dispatches"))?.body).toEqual({
    inputs: { A: "one=two" },
    ref: "main",
    return_run_info: false,
  })
})
