import { expect, test } from "bun:test"
import { forgejoRepositoryCommitsList, forgejoRepositoryGet, forgejoRestTransportCreate } from "../src/index.js"

const commits = [
  { sha: "abc123", commit: { message: "initial commit", author: { name: "Fabian", email: "fabian@example.test" } } },
  { sha: "def456", commit: { message: "second commit" } },
]

function commitsTransportCreate(calls: { path: string; query: string }[]) {
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input) => {
      const url = new URL(String(input))
      calls.push({ path: url.pathname, query: url.searchParams.toString() })
      if (url.pathname.endsWith("/commits")) return new Response(JSON.stringify(commits), { status: 200 })
      return new Response(
        JSON.stringify({
          id: 3,
          name: "demos",
          full_name: "webflows/demos",
          private: true,
          permissions: { pull: true, push: true, admin: true },
        }),
        { status: 200 },
      )
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) throw new Error("transport setup failed")
  return transport.data
}

test("repository commits list sends the limit query and returns parsed commits", async () => {
  const calls: { path: string; query: string }[] = []
  const transport = commitsTransportCreate(calls)

  const listed = await forgejoRepositoryCommitsList(transport, "webflows/demos", { limit: 5 })
  expect(listed.success).toBe(true)
  if (!listed.success) return
  expect(listed.data[0]?.sha).toBe("abc123")
  expect(listed.data[0]?.commit?.message).toBe("initial commit")
  expect(calls).toEqual([{ path: "/api/v1/repos/webflows/demos/commits", query: "limit=5" }])
})

test("repository commits list rejects invalid inputs before using transport", async () => {
  let requests = 0
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async () => {
      requests += 1
      return new Response("[]", { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  expect((await forgejoRepositoryCommitsList(transport.data, "", { limit: 5 })).success).toBe(false)
  expect((await forgejoRepositoryCommitsList(transport.data, "webflows/demos", { limit: 0 })).success).toBe(false)
  expect(requests).toBe(0)
})

test("repository get exposes permissions for access checks", async () => {
  const calls: { path: string; query: string }[] = []
  const transport = commitsTransportCreate(calls)

  const gotten = await forgejoRepositoryGet(transport, "webflows/demos")
  expect(gotten.success).toBe(true)
  if (!gotten.success) return
  expect(gotten.data.permissions?.admin).toBe(true)
  expect(calls).toEqual([{ path: "/api/v1/repos/webflows/demos", query: "" }])
})
