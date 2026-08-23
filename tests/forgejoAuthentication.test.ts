import { expect, test } from "bun:test"
import {
  forgejoAuthVersion,
  forgejoAuthWhoami,
  forgejoOAuthAuthorizationCodePkceCreate,
  forgejoOAuthAuthorizationCodePkceExchange,
  forgejoRestTransportCreate,
} from "../src/index.js"

test("retrieves authenticated whoami and version information", async () => {
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    token: "test-token",
    fetch: async (input) => {
      const path = new URL(input).pathname
      if (path.endsWith("/user")) return new Response(JSON.stringify({ login: "david" }), { status: 200 })
      return new Response(JSON.stringify({ version: "9.0.0" }), { status: 200 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  expect(await forgejoAuthWhoami(transport.data)).toEqual({ success: true, data: { login: "david" } })
  expect(await forgejoAuthVersion(transport.data)).toEqual({ success: true, data: { version: "9.0.0" } })
})

test("creates and exchanges explicit-client PKCE credentials without browser side effects", async () => {
  const created = forgejoOAuthAuthorizationCodePkceCreate({
    baseUrl: "https://forgejo.example.test/forgejo",
    clientId: "installation-client",
    redirectUri: "http://127.0.0.1:26218/",
    state: "state-value",
    codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~",
  })
  expect(created.success).toBe(true)
  if (!created.success) return
  const authorizationUrl = new URL(created.data.authorizationUrl)
  expect(authorizationUrl.pathname).toBe("/forgejo/login/oauth/authorize")
  expect(authorizationUrl.searchParams.get("client_id")).toBe("installation-client")
  expect(authorizationUrl.searchParams.get("state")).toBe("state-value")
  expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256")

  let requestedUrl = ""
  const exchanged = await forgejoOAuthAuthorizationCodePkceExchange({
    baseUrl: "https://forgejo.example.test/forgejo",
    clientId: "installation-client",
    redirectUri: "http://127.0.0.1:26218/",
    code: "authorization-code",
    codeVerifier: created.data.codeVerifier,
    fetch: async (input) => {
      requestedUrl = String(input)
      return new Response(JSON.stringify({ access_token: "oauth-token", expires_in: 3600 }), { status: 200 })
    },
  })
  expect(requestedUrl).toBe("https://forgejo.example.test/forgejo/login/oauth/access_token")
  expect(exchanged).toEqual({ success: true, data: { access_token: "oauth-token", expires_in: 3600 } })
})
