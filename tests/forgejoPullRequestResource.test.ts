import { expect, test } from "bun:test"
import {
  forgejoPullRequestCommentCreate,
  forgejoPullRequestCommitsList,
  forgejoPullRequestCreate,
  forgejoPullRequestDiffGet,
  forgejoPullRequestFilesList,
  forgejoPullRequestGet,
  forgejoPullRequestMerge,
  forgejoPullRequestReviewsList,
  forgejoPullRequestSearch,
  forgejoPullRequestStatus,
  forgejoRestTransportCreate,
} from "../src/index.js"

const pullRequest = {
  number: 7,
  title: "Feature",
  body: "Body",
  state: "open",
  merged: false,
  user: { login: "alice" },
}

test("pull request APIs use pull and shared issue endpoints", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ path: url.pathname, method, ...(body === undefined ? {} : { body }) })
      if (url.pathname === "/api/v1/repos/alice/fork")
        return new Response(JSON.stringify({ parent: { full_name: "bob/upstream" }, default_branch: "main" }))
      if (url.pathname === "/api/v1/repos/bob/upstream")
        return new Response(JSON.stringify({ default_branch: "trunk" }))
      if (url.pathname.endsWith("/issues") && method === "GET") return new Response(JSON.stringify([pullRequest]))
      if (url.pathname.endsWith("/comments") && method === "POST")
        return new Response(JSON.stringify({ id: 1, body: "hello" }))
      if (url.pathname.endsWith("/reviews")) return new Response(JSON.stringify([{ id: 2, state: "APPROVED" }]))
      if (url.pathname.endsWith("/commits") && method === "GET")
        return new Response(JSON.stringify([{ sha: "abc", created_at: "2026-01-01" }]))
      if (url.pathname.endsWith("/status"))
        return new Response(JSON.stringify({ statuses: [{ context: "ci", state: "success" }] }))
      if (url.pathname.endsWith("/merge"))
        return new Response(JSON.stringify({ ...pullRequest, merged: true, state: "closed" }))
      if (url.pathname.includes("/pulls/")) return new Response(JSON.stringify(pullRequest))
      return new Response(JSON.stringify({ ...pullRequest, assignees: [] }))
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const parent = await forgejoPullRequestGet(transport.data, "alice/fork#^7")
  expect(parent.success && parent.data.repo).toEqual({ owner: "bob", name: "upstream" })
  const listed = await forgejoPullRequestSearch(transport.data, "alice/fork", { state: "open" })
  expect(listed.success && listed.data[0]?.number).toBe(7)
  const created = await forgejoPullRequestCreate(transport.data, "alice/fork", {
    title: "Feature",
    head: "feature",
    base: "^trunk",
  })
  expect(created.success).toBe(true)
  await forgejoPullRequestCommentCreate(transport.data, "alice/fork#^7", { body: "hello" })
  const status = await forgejoPullRequestStatus(transport.data, "alice/fork#^7")
  expect(status.success && status.data.statuses[0]?.context).toBe("ci")
  const reviews = await forgejoPullRequestReviewsList(transport.data, "alice/fork#^7")
  expect(reviews.success && reviews.data[0]?.state).toBe("APPROVED")
  await forgejoPullRequestMerge(transport.data, "alice/fork#^7", { method: "squash", message: "Ship it" })

  expect(calls.some((call) => call.path === "/api/v1/repos/bob/upstream/pulls/7")).toBe(true)
  expect(
    calls.some((call) => call.path === "/api/v1/repos/bob/upstream/issues/7/comments" && call.method === "POST"),
  ).toBe(true)
  const createCall = calls.find((call) => call.method === "POST" && call.path.endsWith("/pulls"))
  expect(createCall?.path).toBe("/api/v1/repos/bob/upstream/pulls")
  expect(createCall?.body).toEqual({ title: "Feature", base: "trunk", head: "alice:feature" })
})

test("pull request validation avoids transport requests", async () => {
  let requestCount = 0
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async () => {
      requestCount += 1
      return new Response("{}")
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return
  const result = await forgejoPullRequestCreate(transport.data, "alice/demo", { title: "", head: "main" })
  expect(result.success).toBe(false)
  expect(requestCount).toBe(0)
})

test("pull request view resources validate and paginate files and commits", async () => {
  const requests: URL[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input) => {
      const url = new URL(String(input))
      requests.push(url)
      if (url.pathname.endsWith("/files")) {
        if (url.searchParams.get("page") === "2")
          return new Response(JSON.stringify([{ filename: "second.ts", additions: 1, deletions: 0 }]))
        return new Response(JSON.stringify([{ filename: "first.ts", additions: 3, deletions: 2 }]), {
          headers: { link: `<${url}?page=2&limit=50>; rel="next"` },
        })
      }
      if (url.pathname.endsWith("/commits"))
        return new Response(
          JSON.stringify([
            {
              sha: "1234567890abcdef",
              created: "2026-01-01T00:00:00Z",
              commit: { message: "Commit", author: { name: "Alice", email: "alice@example.test" } },
              stats: { additions: 4, deletions: 1 },
            },
          ]),
        )
      if (url.pathname.endsWith(".patch")) return new Response("From patch\n")
      if (url.pathname.endsWith(".diff")) return new Response("diff --git a/first.ts b/first.ts\n")
      return new Response("[]")
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const files = await forgejoPullRequestFilesList(transport.data, "owner/repo#7", { all: true })
  expect(files.success && files.data.map((file) => file.filename)).toEqual(["first.ts", "second.ts"])
  const commits = await forgejoPullRequestCommitsList(transport.data, "owner/repo#7", { all: true })
  expect(commits.success && commits.data[0]?.stats?.additions).toBe(4)
  const diff = await forgejoPullRequestDiffGet(transport.data, "owner/repo#7", { format: "patch" })
  expect(diff).toEqual({ success: true, data: "From patch\n" })
  expect(requests.some((url) => url.pathname.endsWith("/commits") && url.searchParams.get("files") === "false")).toBe(
    true,
  )
  expect(requests.some((url) => url.pathname.endsWith("/pulls/7.patch"))).toBe(true)

  const invalid = await forgejoPullRequestFilesList(transport.data, "owner/repo#7", { page: 0 })
  expect(invalid.success).toBe(false)
})
