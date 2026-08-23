import { expect, test } from "bun:test"
import {
  forgejoRestTransportCreate,
  forgejoUserActivityList,
  forgejoUserBlock,
  forgejoUserCurrentGet,
  forgejoUserFollow,
  forgejoUserFollowersList,
  forgejoUserFollowingList,
  forgejoUserGet,
  forgejoUserGpgKeyGet,
  forgejoUserGpgKeyUpload,
  forgejoUserGpgKeyVerify,
  forgejoUserGpgKeysList,
  forgejoUserGpgVerificationTokenGet,
  forgejoUserOrganizationsList,
  forgejoUserProfileEdit,
  forgejoUserRepositoriesList,
  forgejoUserSearch,
  forgejoUserSearchPage,
  forgejoUserSshKeyGet,
  forgejoUserSshKeyUpload,
  forgejoUserSshKeysList,
  forgejoUserUnblock,
  forgejoUserUnfollow,
} from "../src/index.js"

const user = { id: 1, login: "alice", username: "alice", full_name: "Alice" }
const repository = { id: 2, name: "demo", full_name: "alice/demo", owner: user }
const sshKey = { id: 3, title: "laptop", key: "ssh-ed25519 AAAA", fingerprint: "aa:bb" }
const gpgKey = { id: 4, key_id: "ABC123", verified: false }

test("user APIs validate responses and map user relations, profile, and keys over transport", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ path: url.pathname, method, ...(body === undefined ? {} : { body }) })
      if (url.pathname === "/api/v1/users/search")
        return new Response(JSON.stringify({ data: [user] }), { status: 200 })
      if (url.pathname === "/api/v1/user") {
        if (method === "PATCH") return new Response(JSON.stringify(user), { status: 200 })
        return new Response(JSON.stringify(user), { status: 200 })
      }
      if (url.pathname === "/api/v1/users/alice") return new Response(JSON.stringify(user), { status: 200 })
      if (url.pathname.endsWith("/following") || url.pathname.endsWith("/followers")) {
        return new Response(JSON.stringify([user]), { status: 200 })
      }
      if (url.pathname === "/api/v1/user/repos") return new Response(JSON.stringify([repository]), { status: 200 })
      if (url.pathname === "/api/v1/user/orgs")
        return new Response(JSON.stringify([{ id: 5, name: "acme" }]), { status: 200 })
      if (url.pathname.endsWith("/activities")) return new Response(JSON.stringify([]), { status: 200 })
      if (url.pathname === "/api/v1/user/keys") {
        if (method === "POST") return new Response(JSON.stringify(sshKey), { status: 201 })
        return new Response(JSON.stringify([sshKey]), { status: 200 })
      }
      if (url.pathname === "/api/v1/user/keys/3") return new Response(JSON.stringify(sshKey), { status: 200 })
      if (url.pathname === "/api/v1/user/gpg_keys") {
        if (method === "POST") return new Response(JSON.stringify(gpgKey), { status: 201 })
        return new Response(JSON.stringify([gpgKey]), { status: 200 })
      }
      if (url.pathname === "/api/v1/user/gpg_keys/4") return new Response(JSON.stringify(gpgKey), { status: 200 })
      if (url.pathname === "/api/v1/user/gpg_key_token")
        return new Response(JSON.stringify("verify-token"), { status: 200 })
      if (method === "PUT" || method === "DELETE" || url.pathname === "/api/v1/user/gpg_key_verify") {
        return new Response(null, { status: 204 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const searched = await forgejoUserSearch(transport.data, { query: "ali" })
  expect(searched.success && searched.data[0]?.login).toBe("alice")
  expect((await forgejoUserGet(transport.data, "alice")).success).toBe(true)
  const currentUser = await forgejoUserCurrentGet(transport.data)
  expect(currentUser.success && currentUser.data.username).toBe("alice")
  const following = await forgejoUserFollowingList(transport.data, "alice")
  expect(following.success && following.data).toHaveLength(1)
  const followers = await forgejoUserFollowersList(transport.data)
  expect(followers.success && followers.data).toHaveLength(1)
  await forgejoUserFollow(transport.data, "bob")
  await forgejoUserUnfollow(transport.data, "bob")
  await forgejoUserBlock(transport.data, "bob")
  await forgejoUserUnblock(transport.data, "bob")
  const repositories = await forgejoUserRepositoriesList(transport.data)
  expect(repositories.success && repositories.data[0]?.full_name).toBe("alice/demo")
  const organizations = await forgejoUserOrganizationsList(transport.data)
  expect(organizations.success && organizations.data[0]?.name).toBe("acme")
  expect((await forgejoUserActivityList(transport.data, "alice", { onlyPerformedBy: true })).success).toBe(true)
  await forgejoUserProfileEdit(transport.data, { fullName: "Alice Example", hideActivity: true })
  const sshKeys = await forgejoUserSshKeysList(transport.data)
  expect(sshKeys.success && sshKeys.data[0]?.id).toBe(3)
  const fetchedSshKey = await forgejoUserSshKeyGet(transport.data, 3)
  expect(fetchedSshKey.success && fetchedSshKey.data.title).toBe("laptop")
  await forgejoUserSshKeyUpload(transport.data, { key: "ssh-ed25519 AAAA", title: "laptop" })
  const gpgKeys = await forgejoUserGpgKeysList(transport.data)
  expect(gpgKeys.success && gpgKeys.data[0]?.key_id).toBe("ABC123")
  const fetchedGpgKey = await forgejoUserGpgKeyGet(transport.data, 4)
  expect(fetchedGpgKey.success && fetchedGpgKey.data.id).toBe(4)
  await forgejoUserGpgKeyUpload(transport.data, { armoredPublicKey: "PUBLIC" })
  await forgejoUserGpgKeyVerify(transport.data, { keyId: "ABC123", armoredSignature: "SIGNATURE" })
  expect(await forgejoUserGpgVerificationTokenGet(transport.data)).toEqual({ success: true, data: "verify-token" })
  expect(calls.find((call) => call.path === "/api/v1/user" && call.method === "PATCH")?.body).toEqual({
    full_name: "Alice Example",
    hide_activity: true,
  })
})

test("user APIs reject invalid inputs before using transport", async () => {
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
  const result = await forgejoUserSshKeyGet(transport.data, 0)
  expect(result.success).toBe(false)
  expect(requests).toBe(0)
})

test("user search forwards the Forgejo page and preserves response pagination metadata", async () => {
  const requests: URL[] = []
  const pageUsers = [user, { ...user, id: 2, login: "bob", username: "bob" }]
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input) => {
      const url = new URL(String(input))
      requests.push(url)
      return new Response(JSON.stringify({ ok: true, data: pageUsers }), {
        status: 200,
        headers: {
          link: '<https://forgejo.example.test/api/v1/users/search?q=ali&page=3&limit=20>; rel="next"',
          "x-total-count": "41",
        },
      })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const page = await forgejoUserSearchPage(transport.data, { query: "ali", page: 2, limit: 20 })
  expect(page).toEqual({
    success: true,
    data: {
      users: pageUsers,
      pagination: {
        next: "https://forgejo.example.test/api/v1/users/search?q=ali&page=3&limit=20",
        totalCount: 41,
      },
    },
  })
  expect(requests[0]?.searchParams.get("q")).toBe("ali")
  expect(requests[0]?.searchParams.get("page")).toBe("2")
  expect(requests[0]?.searchParams.get("limit")).toBe("20")

  const legacy = await forgejoUserSearch(transport.data, "ali")
  expect(legacy.success && legacy.data).toEqual(pageUsers)
  expect(requests[1]?.searchParams.get("page")).toBe("1")
  expect(requests[1]?.searchParams.get("limit")).toBe("20")
})

test("user search keeps an out-of-range Forgejo page as a successful empty page", async () => {
  let requestedPage = ""
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input) => {
      const url = new URL(String(input))
      requestedPage = url.searchParams.get("page") ?? ""
      return new Response(JSON.stringify({ ok: true, data: [] }), {
        status: 200,
        headers: { "x-total-count": "41" },
      })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const result = await forgejoUserSearchPage(transport.data, { query: "ali", page: 4, limit: 20 })
  expect(result).toEqual({ success: true, data: { users: [], pagination: { totalCount: 41 } } })
  expect(requestedPage).toBe("4")
})
