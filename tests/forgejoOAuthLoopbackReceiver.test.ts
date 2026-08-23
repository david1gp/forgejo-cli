import { expect, test } from "bun:test"
import {
  forgejoOAuthLoopbackReceiverCreate,
  type ForgejoOAuthLoopbackReceiverResponse,
  type ForgejoOAuthLoopbackReceiverServer,
  type ForgejoOAuthLoopbackReceiverServerCreate,
} from "../src/index.js"

test("receives one loopback callback, validates state, and does not disclose the code in the browser response", async () => {
  const receiverResult = await forgejoOAuthLoopbackReceiverCreate({
    expectedState: "expected-state",
    timeoutMs: 1_000,
  })
  expect(receiverResult.success).toBe(true)
  if (!receiverResult.success) return

  const response = await fetch(`${receiverResult.data.redirectUri}?code=authorization-code&state=expected-state`)
  const body = await response.text()
  expect(response.status).toBe(200)
  expect(body).toContain("Authentication complete")
  expect(body).not.toContain("authorization-code")
  expect(await receiverResult.data.wait()).toEqual({ success: true, data: "authorization-code" })
})

test("returns safe errors for OAuth errors, missing values, and mismatched state", async () => {
  const cases = [
    ["error=access_denied&state=expected-state", "OAuth provider returned an error"],
    ["state=expected-state", "OAuth callback is missing code"],
    ["code=authorization-code", "OAuth callback is missing state"],
    ["code=authorization-code&state=wrong-state", "OAuth callback state does not match expected state"],
  ] as const

  for (const [query, message] of cases) {
    const receiverResult = await forgejoOAuthLoopbackReceiverCreate({
      expectedState: "expected-state",
      timeoutMs: 1_000,
    })
    expect(receiverResult.success).toBe(true)
    if (!receiverResult.success) continue
    const response = await fetch(`${receiverResult.data.redirectUri}?${query}`)
    expect(response.status).toBe(400)
    expect(await receiverResult.data.wait()).toMatchObject({ success: false, errorMessage: message })
  }
})

test("rejects other paths and methods without consuming the callback", async () => {
  const receiverResult = await forgejoOAuthLoopbackReceiverCreate({ expectedState: "expected-state", timeoutMs: 1_000 })
  expect(receiverResult.success).toBe(true)
  if (!receiverResult.success) return

  const wrongPath = await fetch(`${receiverResult.data.redirectUri}/other`)
  expect(wrongPath.status).toBe(404)
  const wrongMethod = await fetch(receiverResult.data.redirectUri, { method: "POST" })
  expect(wrongMethod.status).toBe(405)
  const callback = await fetch(`${receiverResult.data.redirectUri}?code=code&state=expected-state`)
  expect(callback.status).toBe(200)
  expect(await receiverResult.data.wait()).toEqual({ success: true, data: "code" })
})

test("supports an injected server and closes reliably on timeout", async () => {
  let handler: Parameters<ForgejoOAuthLoopbackReceiverServerCreate>[0] | undefined
  let closeCount = 0
  const serverCreate: ForgejoOAuthLoopbackReceiverServerCreate = (nextHandler) => {
    handler = nextHandler
    return {
      on() {},
      listen(_options, callback) {
        callback()
      },
      address() {
        return { address: "127.0.0.1", port: 43_210 }
      },
      close(callback) {
        closeCount += 1
        callback()
      },
    }
  }

  const receiverResult = await forgejoOAuthLoopbackReceiverCreate({
    expectedState: "expected-state",
    timeoutMs: 10,
    serverCreate,
  })
  expect(receiverResult.success).toBe(true)
  if (!receiverResult.success || !handler) return
  expect(receiverResult.data.redirectUri).toBe("http://127.0.0.1:43210/oauth/callback")

  await new Promise((resolve) => setTimeout(resolve, 25))
  expect(await receiverResult.data.wait()).toMatchObject({
    success: false,
    errorMessage: "OAuth callback receiver timed out",
  })
  expect(closeCount).toBe(1)
})
