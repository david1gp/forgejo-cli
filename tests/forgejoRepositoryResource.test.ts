import { expect, test } from "bun:test"
import {
  forgejoRepositoryAvatarDelete,
  forgejoRepositoryAvatarUpdate,
  forgejoRepositoryCloneMetadataGet,
  forgejoRepositoryCreate,
  forgejoRepositoryDelete,
  forgejoRepositoryEdit,
  forgejoRepositoryFork,
  forgejoRepositoryGet,
  forgejoRepositoryLabelCreate,
  forgejoRepositoryLabelDelete,
  forgejoRepositoryLabelEdit,
  forgejoRepositoryLabelsGet,
  forgejoRepositoryMigrate,
  forgejoRepositoryReadmeGet,
  forgejoRepositoryStar,
  forgejoRepositoryStarStatusGet,
  forgejoRepositoryUnitsEdit,
  forgejoRepositoryUnstar,
  forgejoRepositoryUnwatch,
  forgejoRepositoryWatch,
  forgejoRepositoryWatchStatusGet,
  forgejoRestTransportCreate,
} from "../src/index.js"

const repository = {
  id: 7,
  owner: { id: 1, login: "alice", username: "alice" },
  name: "demo",
  full_name: "alice/demo",
  html_url: "https://forgejo.example.test/alice/demo",
  clone_url: "https://forgejo.example.test/alice/demo.git",
  ssh_url: "ssh://git@forgejo.example.test/alice/demo.git",
  parent: null,
}

test("repository resources validate, map, parse, and use the existing transport", async () => {
  const calls: { url: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = String(input)
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ url, method, ...(body === undefined ? {} : { body }) })
      const path = new URL(url).pathname
      if (method === "GET" && path.endsWith("/contents")) {
        return new Response(JSON.stringify([{ name: "README.md", path: "README.md", type: "file" }]), { status: 200 })
      }
      if (method === "GET" && path.endsWith("/raw/README.md")) return new Response("# Demo", { status: 200 })
      if (method === "GET" && path.includes("/user/starred/")) return new Response(JSON.stringify({}), { status: 404 })
      if (method === "GET" && path.includes("/user/subscriptions/")) return new Response(null, { status: 204 })
      if (method === "GET" && path.endsWith("/labels")) {
        return new Response(JSON.stringify([{ id: 3, name: "bug", color: "ff0000" }]), { status: 200 })
      }
      if (method === "DELETE" || method === "PUT") return new Response(null, { status: 204 })
      return new Response(JSON.stringify(repository), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const created = await forgejoRepositoryCreate(transport.data, {
    organization: "team/a",
    name: "demo",
    autoInit: false,
    defaultBranch: "main",
    private: true,
  })
  expect(created.success).toBe(true)
  expect(calls[0]).toEqual({
    url: "https://forgejo.example.test/api/v1/orgs/team%2Fa/repos",
    method: "POST",
    body: { name: "demo", private: true, auto_init: false, default_branch: "main" },
  })

  await forgejoRepositoryFork(transport.data, "alice/demo", { name: "demo-fork", organization: "team" })
  await forgejoRepositoryMigrate(transport.data, {
    cloneAddr: "https://git.example.test/demo.git",
    repoName: "demo",
    repoOwner: "alice",
    include: { pullRequests: true },
    service: "forgejo",
  })
  const fetched = await forgejoRepositoryGet(transport.data, { owner: "alice", name: "demo" })
  expect(fetched.success).toBe(true)
  const readme = await forgejoRepositoryReadmeGet(transport.data, "alice/demo")
  expect(readme).toEqual({ success: true, data: "# Demo" })
  const clone = await forgejoRepositoryCloneMetadataGet(transport.data, "alice/demo")
  expect(clone.success && clone.data.cloneUrl).toBe("https://forgejo.example.test/alice/demo.git")

  await forgejoRepositoryStar(transport.data, "alice/demo")
  const starred = await forgejoRepositoryStarStatusGet(transport.data, "alice/demo")
  expect(starred).toEqual({ success: true, data: false })
  await forgejoRepositoryUnstar(transport.data, "alice/demo")
  await forgejoRepositoryWatch(transport.data, "alice/demo")
  const watched = await forgejoRepositoryWatchStatusGet(transport.data, "alice/demo")
  expect(watched).toEqual({ success: true, data: true })
  await forgejoRepositoryUnwatch(transport.data, "alice/demo")

  await forgejoRepositoryEdit(transport.data, "alice/demo", { defaultBranch: "trunk", enablePrune: true })
  await forgejoRepositoryUnitsEdit(transport.data, "alice/demo", { issues: true, defaultMergeStyle: "squash" })
  const labels = await forgejoRepositoryLabelsGet(transport.data, "alice/demo", { includeArchived: true })
  expect(labels.success && labels.data[0]?.name).toBe("bug")
  await forgejoRepositoryLabelCreate(transport.data, "alice/demo", { name: "feature", color: "00ff00" })
  await forgejoRepositoryLabelEdit(transport.data, "alice/demo", "bug", { color: "0000ff" })
  await forgejoRepositoryLabelDelete(transport.data, "alice/demo", "bug")
  await forgejoRepositoryDelete(transport.data, "alice/demo")

  const migrateCall = calls.find((call) => call.url.endsWith("/api/v1/repos/migrate"))
  expect(migrateCall?.body).toMatchObject({
    clone_addr: "https://git.example.test/demo.git",
    repo_name: "demo",
    repo_owner: "alice",
    pull_requests: true,
    service: "gitea",
  })
  const unitsCall = calls.find((call) => call.method === "PATCH" && call.body && "has_issues" in (call.body as object))
  expect(unitsCall?.body).toMatchObject({ has_issues: true, default_merge_style: "squash" })
})

test("repository resources return validation errors without making requests", async () => {
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async () => new Response("{}", { status: 200 }),
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return
  const result = await forgejoRepositoryCreate(transport.data, { name: "" })
  expect(result.success).toBe(false)
})

test("repository avatar resources send Forgejo's base64 JSON and delete endpoint", async () => {
  const calls: { method: string; url: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      calls.push({
        method: init?.method ?? "GET",
        url: String(input),
        ...(typeof init?.body === "string" ? { body: JSON.parse(init.body) } : {}),
      })
      return new Response(null, { status: 204 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const updated = await forgejoRepositoryAvatarUpdate(transport.data, "alice/demo", { image: "AAH/" })
  expect(updated).toEqual({ success: true, data: null })
  const deleted = await forgejoRepositoryAvatarDelete(transport.data, "alice/demo")
  expect(deleted).toEqual({ success: true, data: null })
  expect(calls).toEqual([
    {
      method: "POST",
      url: "https://forgejo.example.test/api/v1/repos/alice/demo/avatar",
      body: { image: "AAH/" },
    },
    {
      method: "DELETE",
      url: "https://forgejo.example.test/api/v1/repos/alice/demo/avatar",
    },
  ])

  const invalid = await forgejoRepositoryAvatarUpdate(transport.data, "alice/demo", { image: "" })
  expect(invalid.success).toBe(false)
})
