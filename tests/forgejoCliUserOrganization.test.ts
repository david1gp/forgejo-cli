import { expect, test } from "bun:test"
import { createResult } from "#result"
import type { ForgejoFetch } from "../src/http/forgejoRestTransportCreate.js"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"

const env = { FORGEJO_TOKEN: "test-token" }

function capture() {
  const output: string[] = []
  return {
    output,
    outputWrite: (value: string) => {
      output.push(value)
      return createResult(null)
    },
  }
}

test("parses the user and organization command trees", () => {
  const user = forgejoCliParse(["user", "repos", "alice", "--starred", "--sort", "stars"], { stdoutIsTty: false })
  expect(user.success).toBe(true)
  if (user.success)
    expect(user.data).toMatchObject({ kind: "user-repos", user: "alice", starred: true, sort: "stars", page: 1 })

  const team = forgejoCliParse(["org", "team", "repo", "list", "acme", "core", "--page", "2"], { stdoutIsTty: false })
  expect(team.success).toBe(true)
  if (team.success)
    expect(team.data).toMatchObject({ kind: "org-team-repo-list", organization: "acme", team: "core", page: 2 })

  const label = forgejoCliParse(["org", "label", "edit", "acme", "bug", "--color", "#ff0000", "--archived", "true"], {
    stdoutIsTty: false,
  })
  expect(label.success).toBe(true)
  if (label.success)
    expect(label.data).toMatchObject({ kind: "org-label-edit", options: { color: "#ff0000", archived: true } })

  const omittedUser = forgejoCliParse(["user", "repos"], { stdoutIsTty: false })
  expect(omittedUser.success).toBe(true)
  if (omittedUser.success) {
    expect(omittedUser.data.kind).toBe("user-repos")
    expect("user" in omittedUser.data).toBe(false)
  }

  expect(forgejoCliParse(["user", "edit", "name", "--editor"], { stdoutIsTty: false }).success).toBe(false)
  expect(forgejoCliParse(["user", "edit", "bio", "--unset"], { stdoutIsTty: false }).success).toBe(false)
  expect(forgejoCliParse(["org", "view"], { stdoutIsTty: false }).success).toBe(false)
  expect(forgejoCliParse(["org", "list", "--only-member-of", "--page", "2"], { stdoutIsTty: false }).success).toBe(
    false,
  )
})

test("runs user view and browse with JSON, browser, and current-user resolution", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ login: "alice", full_name: "Alice", description: "A profile" }), {
      status: 200,
    })
  }
  const viewCapture = capture()
  const view = await forgejoCliRun(["--json", "--host", "https://forgejo.example.test", "user", "view"], {
    env,
    fetch,
    outputWrite: viewCapture.outputWrite,
  })
  expect(view.success).toBe(true)
  expect(JSON.parse(viewCapture.output.join(""))).toMatchObject({ login: "alice" })

  let opened = ""
  const browse = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "browse"], {
    env,
    fetch,
    browserOpen: async (url) => {
      opened = url
      return createResult(null)
    },
    outputWrite: viewCapture.outputWrite,
  })
  expect(browse.success).toBe(true)
  expect(opened).toBe("https://forgejo.example.test/alice")
  expect(requests).toEqual(["https://forgejo.example.test/api/v1/user", "https://forgejo.example.test/api/v1/user"])
})

test("uses FJ_USER for omitted user targets without overriding explicit users", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify([]), { status: 200 })
  }
  const environment = { ...env, FJ_USER: "alice" }

  const defaulted = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "repos"], {
    env: environment,
    fetch,
    outputWrite: capture().outputWrite,
  })
  const explicit = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "repos", "bob"], {
    env: environment,
    fetch,
    outputWrite: capture().outputWrite,
  })

  expect(defaulted.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/users/alice/repos?page=1&limit=50",
    "https://forgejo.example.test/api/v1/users/bob/repos?page=1&limit=50",
  ])
})

test("keeps FJ_USER and FJ_ORG as separate CLI defaults", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    const url = new URL(String(input))
    return url.pathname.endsWith("/users/alice") || url.pathname.endsWith("/users/bob")
      ? new Response(JSON.stringify({ login: url.pathname.endsWith("/alice") ? "alice" : "bob" }), { status: 200 })
      : new Response(JSON.stringify({}), { status: 200 })
  }
  const environment = { ...env, FJ_USER: "alice", FJ_ORG: "team" }

  const defaulted = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "view"], {
    env: environment,
    fetch,
    outputWrite: capture().outputWrite,
  })
  const explicit = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "view", "bob"], {
    env: environment,
    fetch,
    outputWrite: capture().outputWrite,
  })

  expect(defaulted.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/users/alice",
    "https://forgejo.example.test/api/v1/users/bob",
  ])
})

test("ignores blank FJ_USER and FJ_ORG values instead of creating empty targets", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    const url = new URL(String(input))
    return url.pathname === "/api/v1/user/repos"
      ? new Response(JSON.stringify([]), { status: 200 })
      : new Response(JSON.stringify({ name: "demo", full_name: "demo" }), { status: 201 })
  }

  const repository = await forgejoCliRun(["--host", "https://forgejo.example.test", "repo", "create", "demo"], {
    env: { ...env, FJ_ORG: " ", FJ_USER: "alice" },
    fetch,
    outputWrite: capture().outputWrite,
  })
  const user = await forgejoCliRun(["--host", "https://forgejo.example.test", "user", "repos"], {
    env: { ...env, FJ_ORG: "team", FJ_USER: "\t" },
    fetch,
    outputWrite: capture().outputWrite,
  })

  expect(repository.success).toBe(true)
  expect(user.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/user/repos",
    "https://forgejo.example.test/api/v1/user/repos?page=1&limit=50",
  ])
})

test("does not submit an empty profile value without --unset", async () => {
  const captureOutput = capture()
  let requests = 0
  const result = await forgejoCliRun(["--json", "--host", "https://forgejo.example.test", "user", "edit", "name", ""], {
    env,
    fetch: async () => {
      requests += 1
      return new Response(null, { status: 204 })
    },
    outputWrite: captureOutput.outputWrite,
  })
  expect(result.success).toBe(true)
  expect(requests).toBe(0)
  expect(JSON.parse(captureOutput.output.join(""))).toMatchObject({ changed: false })
})

test("reports user search ranges from Forgejo totals and preserves out-of-range pages", async () => {
  const requests: string[] = []
  const output: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    const url = new URL(String(input))
    requests.push(url.toString())
    const page = url.searchParams.get("page")
    const data = page === "4" ? [] : [{ login: "alice" }, { login: "bob" }]
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "x-total-count": "41" },
    })
  }
  const options = {
    env,
    fetch,
    outputWrite: (value: string) => {
      output.push(value)
      return createResult(null)
    },
  }

  const page = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "user", "search", "ali", "--page", "2"],
    options,
  )
  const outOfRange = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "user", "search", "ali", "--page", "4"],
    options,
  )

  expect(page.success).toBe(true)
  expect(outOfRange.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/users/search?q=ali&page=2&limit=20",
    "https://forgejo.example.test/api/v1/users/search?q=ali&page=4&limit=20",
  ])
  expect(output).toEqual(["Showing 21-22 of 41 users\nalice\nbob\n", "Showing 0 of 41 users\n"])
})

test("uploads an SSH key through an injected filesystem and requires safe title confirmation", async () => {
  const requests: Request[] = []
  const captureOutput = capture()
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "user", "key", "upload", "key.pub"],
    {
      env,
      fileRead: async () => createResult("ssh-ed25519 AAAA comment\n"),
      confirm: async (message) => message.includes("comment"),
      fetch: async (input, init) => {
        requests.push(new Request(String(input), init))
        return new Response(JSON.stringify({ id: 7, title: "comment", key: "ssh-ed25519 AAAA comment" }), {
          status: 201,
        })
      },
      outputWrite: captureOutput.outputWrite,
    },
  )
  expect(result.success).toBe(true)
  expect(JSON.parse(captureOutput.output.join(""))).toMatchObject({ id: 7, title: "comment" })
  expect(await requests[0]?.json()).toMatchObject({ title: "comment", read_only: false })
})

test("keeps organization label deletion safe in non-interactive automation", async () => {
  const captureOutput = capture()
  const prompts: string[] = []
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "org", "label", "rm", "acme", "bug"],
    {
      env,
      stdinRead: async () => createResult("n"),
      promptWrite: (value) => {
        prompts.push(value)
        return createResult(null)
      },
      outputWrite: captureOutput.outputWrite,
    },
  )
  expect(result.success).toBe(true)
  expect(JSON.parse(captureOutput.output.join(""))).toEqual({ cancelled: true })
  expect(prompts).toEqual(["Delete label acme/bug? [y/N] "])
})
