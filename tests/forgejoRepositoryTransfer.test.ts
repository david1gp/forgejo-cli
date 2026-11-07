import { expect, test } from "bun:test"
import {
  forgejoRepositoryTransferAccept,
  forgejoRepositoryTransferCreate,
  forgejoRestTransportCreate,
} from "../src/index.js"

const repository = { id: 3, name: "demos", full_name: "webflows/demos", private: true }

type RecordedCall = { path: string; method: string; body?: unknown }

function transferTransportCreate(calls: RecordedCall[], body: unknown, status = 200) {
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const parsed = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({
        path: url.pathname,
        method: init?.method ?? "GET",
        ...(parsed === undefined ? {} : { body: parsed }),
      })
      return new Response(body === null ? null : JSON.stringify(body), { status })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) throw new Error("transport setup failed")
  return transport.data
}

test("repository transfer create posts the new owner to the transfer path", async () => {
  const calls: RecordedCall[] = []
  const transport = transferTransportCreate(calls, repository)

  const created = await forgejoRepositoryTransferCreate(transport, "contentoren/demos", { newOwner: "webflows" })
  expect(created.success).toBe(true)
  if (!created.success) return
  expect(created.data.full_name).toBe("webflows/demos")
  expect(calls).toEqual([
    {
      path: "/api/v1/repos/contentoren/demos/transfer",
      method: "POST",
      body: { new_owner: "webflows" },
    },
  ])
})

test("repository transfer create forwards team ids and preserves a pending transfer marker", async () => {
  const calls: RecordedCall[] = []
  const pending = { ...repository, repo_transfer: { id: 7, doer: { username: "contentoren-master" } } }
  const transport = transferTransportCreate(calls, pending)

  const created = await forgejoRepositoryTransferCreate(transport, "contentoren/demos", {
    newOwner: "webflows",
    teamIds: [1, 2],
  })
  expect(created.success).toBe(true)
  if (!created.success) return
  expect(calls[0]?.body).toEqual({ new_owner: "webflows", team_ids: [1, 2] })
  expect("repo_transfer" in created.data && created.data.repo_transfer !== null).toBe(true)
})

test("repository transfer accept posts to the transfer accept path", async () => {
  const calls: RecordedCall[] = []
  const transport = transferTransportCreate(calls, null, 204)

  const accepted = await forgejoRepositoryTransferAccept(transport, "contentoren/demos")
  expect(accepted).toEqual({ success: true, data: null })
  expect(calls).toEqual([{ path: "/api/v1/repos/contentoren/demos/transfer/accept", method: "POST" }])
})

test("repository transfer operations reject invalid inputs before using transport", async () => {
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

  expect((await forgejoRepositoryTransferCreate(transport.data, "", { newOwner: "webflows" })).success).toBe(false)
  expect((await forgejoRepositoryTransferCreate(transport.data, "contentoren/demos", {})).success).toBe(false)
  expect((await forgejoRepositoryTransferCreate(transport.data, "contentoren/demos", { newOwner: "  " })).success).toBe(
    false,
  )
  expect(
    (await forgejoRepositoryTransferCreate(transport.data, "contentoren/demos", { newOwner: "webflows", teamIds: [0] }))
      .success,
  ).toBe(false)
  expect((await forgejoRepositoryTransferAccept(transport.data, "")).success).toBe(false)
  expect(requests).toBe(0)
})
