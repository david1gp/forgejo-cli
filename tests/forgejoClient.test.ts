import { expect, test } from "bun:test"
import { forgejoClientCreate } from "../src/index.js"

test("creates an authenticated client from explicit options", async () => {
  let requestInit: RequestInit | undefined
  const client = await forgejoClientCreate({
    baseUrl: "https://forgejo.example.test/forgejo",
    token: "explicit-token",
    fetch: async (_input, init) => {
      requestInit = init
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    },
  })

  expect(client.success).toBe(true)
  if (!client.success) return
  expect(client.data.host).toBe("forgejo.example.test")
  expect(client.data.baseUrl).toBe("https://forgejo.example.test/forgejo/")

  const response = await client.data.transport.request({ path: "/api/v1/version" })
  expect(response.success).toBe(true)
  expect(new Headers(requestInit?.headers).get("Authorization")).toBe("token explicit-token")
})

test("uses environment host and configured credentials by default", async () => {
  const client = await forgejoClientCreate({
    env: { FORGEJO_HOST: "forgejo.example.test" },
    configuration: { hosts: { "forgejo.example.test": "configured-token" } },
    fetch: async () => new Response("{}", { status: 200 }),
  })

  expect(client.success).toBe(true)
  if (!client.success) return
  expect(client.data.host).toBe("forgejo.example.test")
})

test("does not include a remote credential in parse errors", async () => {
  const result = await forgejoClientCreate({
    baseUrl: "https://token:secret@forgejo.example.test",
    token: "safe-token",
  })

  expect(result.success).toBe(false)
  if (!result.success) expect(JSON.stringify(result)).not.toContain("secret")
})
