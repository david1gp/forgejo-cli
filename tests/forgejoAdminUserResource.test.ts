import { expect, test } from "bun:test"
import {
  forgejoAdminUserCreate,
  forgejoAdminUserEdit,
  forgejoAdminUserRename,
  forgejoAdminUserSshKeyUpload,
  forgejoRestTransportCreate,
  forgejoUserCurrentGet,
  forgejoUserSshKeysList,
  forgejoUserTokenCreate,
  forgejoUserTokenDelete,
  forgejoUserTokensList,
} from "../src/index.js"

const user = { id: 7, login: "tim", username: "tim", full_name: "Tim", email: "tim@contentoren.de" }
const sshKey = { id: 9, title: "forgejo-tim", key: "ssh-ed25519 AAAA", fingerprint: "bb:cc" }
const token = { id: 11, name: "tim-server", sha1: "secret-sha", token_last_eight: "12345678", scopes: ["all"] }

function adminTransportCreate(calls: { path: string; method: string; body?: unknown }[]) {
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ path: url.pathname, method, ...(body === undefined ? {} : { body }) })
      if (url.pathname === "/api/v1/admin/users" && method === "POST")
        return new Response(JSON.stringify(user), { status: 201 })
      if (url.pathname === "/api/v1/admin/users/tim" && method === "PATCH")
        return new Response(JSON.stringify({ ...user, full_name: "Tim Krohn" }), { status: 200 })
      if (url.pathname === "/api/v1/admin/users/tim/rename" && method === "POST")
        return new Response(JSON.stringify({ ...user, username: "tim.krohn" }), { status: 200 })
      if (url.pathname === "/api/v1/admin/users/tim/keys" && method === "POST")
        return new Response(JSON.stringify(sshKey), { status: 201 })
      if (url.pathname === "/api/v1/users/tim/tokens") {
        if (method === "POST") return new Response(JSON.stringify(token), { status: 201 })
        return new Response(JSON.stringify([token]), { status: 200 })
      }
      if (url.pathname === "/api/v1/users/tim/keys") return new Response(JSON.stringify([sshKey]), { status: 200 })
      if (url.pathname === "/api/v1/user/keys") return new Response(JSON.stringify([sshKey]), { status: 200 })
      if (method === "DELETE") return new Response(null, { status: 204 })
      return new Response(JSON.stringify([]), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) throw new Error("transport setup failed")
  return transport.data
}

test("admin user create shapes the Forgejo admin payload with snake_case fields", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = adminTransportCreate(calls)

  const created = await forgejoAdminUserCreate(transport, {
    username: "tim",
    email: "tim@contentoren.de",
    fullName: "Tim",
    password: "secret-password",
    mustChangePassword: false,
    visibility: "public",
  })
  expect(created.success && created.data.username).toBe("tim")
  expect(calls.find((call) => call.path === "/api/v1/admin/users")).toEqual({
    path: "/api/v1/admin/users",
    method: "POST",
    body: {
      username: "tim",
      email: "tim@contentoren.de",
      full_name: "Tim",
      password: "secret-password",
      must_change_password: false,
      visibility: "public",
    },
  })
})

test("admin user edit and rename target the admin user paths", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = adminTransportCreate(calls)

  const edited = await forgejoAdminUserEdit(transport, "tim", { email: "tk@example.test", fullName: "Tim Krohn" })
  expect(edited.success && edited.data.full_name).toBe("Tim Krohn")
  expect(calls.find((call) => call.method === "PATCH")).toEqual({
    path: "/api/v1/admin/users/tim",
    method: "PATCH",
    body: { email: "tk@example.test", full_name: "Tim Krohn" },
  })

  const renamed = await forgejoAdminUserRename(transport, "tim", { newUsername: "tim.krohn" })
  expect(renamed.success && renamed.data.username).toBe("tim.krohn")
  expect(calls.find((call) => call.path === "/api/v1/admin/users/tim/rename")).toEqual({
    path: "/api/v1/admin/users/tim/rename",
    method: "POST",
    body: { new_username: "tim.krohn" },
  })
})

test("admin user SSH key upload posts key and title to the admin keys path", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = adminTransportCreate(calls)

  const uploaded = await forgejoAdminUserSshKeyUpload(transport, "tim", {
    key: "ssh-ed25519 AAAA",
    title: "forgejo-tim",
  })
  expect(uploaded.success && uploaded.data.title).toBe("forgejo-tim")
  expect(calls.find((call) => call.path === "/api/v1/admin/users/tim/keys")).toEqual({
    path: "/api/v1/admin/users/tim/keys",
    method: "POST",
    body: { key: "ssh-ed25519 AAAA", title: "forgejo-tim" },
  })
})

test("user tokens list, create, and delete use the per-user token paths", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = adminTransportCreate(calls)

  const listed = await forgejoUserTokensList(transport, "tim")
  expect(listed.success && listed.data[0]?.name).toBe("tim-server")

  const created = await forgejoUserTokenCreate(transport, "tim", { name: "tim-server", scopes: ["all"] })
  expect(created.success && created.data.sha1).toBe("secret-sha")
  expect(calls.find((call) => call.path === "/api/v1/users/tim/tokens" && call.method === "POST")).toEqual({
    path: "/api/v1/users/tim/tokens",
    method: "POST",
    body: { name: "tim-server", scopes: ["all"] },
  })

  const deleted = await forgejoUserTokenDelete(transport, "tim", 11)
  expect(deleted).toEqual({ success: true, data: null })
  expect(calls.find((call) => call.method === "DELETE")).toEqual({
    path: "/api/v1/users/tim/tokens/11",
    method: "DELETE",
  })
})

test("user SSH key listing keeps the own path by default and reads public keys per username", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = adminTransportCreate(calls)

  const own = await forgejoUserSshKeysList(transport)
  expect(own.success && own.data[0]?.id).toBe(9)
  expect(calls[0]?.path).toBe("/api/v1/user/keys")

  const publik = await forgejoUserSshKeysList(transport, "tim")
  expect(publik.success && publik.data[0]?.title).toBe("forgejo-tim")
  expect(calls[1]?.path).toBe("/api/v1/users/tim/keys")
})

test("admin and token operations reject invalid inputs before using transport", async () => {
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

  expect((await forgejoAdminUserCreate(transport.data, { username: "tim" })).success).toBe(false)
  expect((await forgejoAdminUserEdit(transport.data, "tim", { visibility: "everyone" })).success).toBe(false)
  expect((await forgejoAdminUserRename(transport.data, "tim", { newUsername: "  " })).success).toBe(false)
  expect((await forgejoAdminUserSshKeyUpload(transport.data, "", { key: "k", title: "t" })).success).toBe(false)
  expect((await forgejoUserTokensList(transport.data, "")).success).toBe(false)
  expect((await forgejoUserTokenCreate(transport.data, "tim", { name: "" })).success).toBe(false)
  expect((await forgejoUserTokenDelete(transport.data, "tim", 0)).success).toBe(false)
  expect((await forgejoUserSshKeysList(transport.data, "")).success).toBe(false)
  expect(requests).toBe(0)
})

test("a PAT is verified through a second transport built with that PAT", async () => {
  const sentHeaders: Record<string, string>[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    token: "user-pat",
    fetch: async (input, init) => {
      sentHeaders.push(Object.fromEntries(new Headers(init?.headers).entries()))
      return new Response(JSON.stringify(user), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const current = await forgejoUserCurrentGet(transport.data)
  expect(current.success && current.data.username).toBe("tim")
  expect(sentHeaders[0]?.authorization).toBe("token user-pat")
})

test("a transport-level token wins over a per-call authorization header", async () => {
  const sentHeaders: Record<string, string>[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    token: "transport-token",
    fetch: async (input, init) => {
      sentHeaders.push(Object.fromEntries(new Headers(init?.headers).entries()))
      return new Response(JSON.stringify(user), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  await transport.data.request({ path: "/api/v1/user", headers: { Authorization: "token per-call" } })
  expect(sentHeaders[0]?.authorization).toBe("token transport-token")
})
