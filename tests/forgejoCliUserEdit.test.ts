import { expect, test } from "bun:test"
import { createResult } from "#result"
import type { ForgejoFetch } from "../src/http/forgejoRestTransportCreate.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"

test("maps email hidden and public visibility to hide_email without hide_activity", async () => {
  const bodies: unknown[] = []
  const fetch: ForgejoFetch = async (_input, init) => {
    if (init?.method === "PATCH") bodies.push(JSON.parse(String(init.body)))
    return new Response(JSON.stringify({ id: 1, login: "alice", username: "alice", full_name: "Alice" }), {
      status: 200,
    })
  }
  const options = {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch,
    outputWrite: () => createResult(null),
  }

  const hidden = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "user", "edit", "email", "--visibility", "hidden"],
    options,
  )
  const visible = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "user", "edit", "email", "--visibility", "public"],
    options,
  )

  expect(hidden.success).toBe(true)
  expect(visible.success).toBe(true)
  expect(bodies).toEqual([{ hide_email: true }, { hide_email: false }])
})
