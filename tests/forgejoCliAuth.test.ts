import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type {
  ForgejoOAuthLoopbackReceiverCreateOptions,
  ForgejoOAuthLoopbackReceiver,
  ForgejoResult,
} from "../src/index.js"
import { forgejoCliRun } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test("runs OAuth login with injected receiver, browser, and fetch effects", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-auth-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  let expectedState = ""
  let openedUrl = ""
  let receiverClosed = false
  const output: string[] = []
  const receiverCreate = async (
    options: ForgejoOAuthLoopbackReceiverCreateOptions,
  ): Promise<ForgejoResult<ForgejoOAuthLoopbackReceiver>> => {
    expectedState = String(options.expectedState)
    return {
      success: true,
      data: {
        redirectUri: "http://127.0.0.1:43210/oauth/callback",
        wait: async () => ({ success: true, data: "authorization-code" }),
        close: async () => {
          receiverClosed = true
        },
      },
    }
  }
  const fetcher = async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input))
    if (url.pathname.endsWith("/access_token")) {
      const body = new URLSearchParams(String(init?.body))
      expect(body.get("code")).toBe("authorization-code")
      expect(body.get("redirect_uri")).toBe("http://127.0.0.1:43210/oauth/callback")
      return new Response(
        JSON.stringify({ access_token: "oauth-access-token", refresh_token: "must-not-persist", expires_in: 3600 }),
        { status: 200 },
      )
    }
    expect(url.pathname.endsWith("/user")).toBe(true)
    expect(new Headers(init?.headers).get("Authorization")).toBe("token oauth-access-token")
    return new Response(JSON.stringify({ login: "alice" }), { status: 200 })
  }

  const result = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "auth", "login", "--client-id", "installation-client"],
    {
      env: { FORGEJO_CONFIG_FILE: configurationPath },
      fetch: fetcher,
      oauthLoopbackReceiverCreate: receiverCreate,
      browserOpen: async (url) => {
        openedUrl = url
        return { success: true, data: null }
      },
      outputWrite: (value) => {
        output.push(value)
        return { success: true, data: null }
      },
      stdoutIsTty: false,
    },
  )

  expect(result).toEqual({ success: true, data: 0 })
  const authorizationUrl = new URL(openedUrl)
  expect(authorizationUrl.searchParams.get("client_id")).toBe("installation-client")
  expect(authorizationUrl.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:43210/oauth/callback")
  expect(authorizationUrl.searchParams.get("state")).toBe(expectedState)
  expect(output.join("")).toContain("Logged in as alice")
  expect(output.join("")).not.toContain("oauth-access-token")
  expect(receiverClosed).toBe(true)
  expect(JSON.parse(await readFile(configurationPath, "utf8"))).toEqual({
    hosts: { "forgejo.example.test": { type: "OAuth", token: "oauth-access-token" } },
  })
})
