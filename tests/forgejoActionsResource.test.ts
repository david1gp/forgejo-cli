import { expect, test } from "bun:test"
import {
  forgejoActionRunGet,
  forgejoActionRunsList,
  forgejoActionSecretCreate,
  forgejoActionSecretDelete,
  forgejoActionSecretList,
  forgejoActionTasksList,
  forgejoActionVariableCreate,
  forgejoActionVariableDelete,
  forgejoActionVariableList,
  forgejoActionWorkflowDispatch,
  forgejoRestTransportCreate,
} from "../src/index.js"

test("actions resources validate and map source operations over the transport", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = String(input)
      const path = new URL(url).pathname
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ path, method, ...(body === undefined ? {} : { body }) })
      if (path.endsWith("/actions/tasks"))
        return new Response(JSON.stringify({ total_count: 1, workflow_runs: [{ id: 7, status: "success" }] }))
      if (path.endsWith("/actions/runs/7")) return new Response(JSON.stringify({ id: 7, title: "Build" }))
      if (path.endsWith("/actions/runs"))
        return new Response(JSON.stringify({ total_count: 1, workflow_runs: [{ id: 7, status: "success" }] }))
      if (path.endsWith("/actions/variables") && method === "GET")
        return new Response(JSON.stringify([{ name: "GREETING", data: "hello", owner_id: 1, repo_id: 2 }]))
      if (path.endsWith("/actions/variables/EXISTS") && method === "POST")
        return new Response("conflict", { status: 409 })
      if (path.includes("/actions/variables/") || path.includes("/actions/secrets/"))
        return new Response(null, { status: 204 })
      if (path.endsWith("/actions/secrets")) return new Response(JSON.stringify([{ name: "TOKEN" }]))
      if (path.endsWith("/dispatches")) return new Response(null, { status: 204 })
      return new Response("not found", { status: 404 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const tasks = await forgejoActionTasksList(transport.data, "alice/demo", { status: "success" })
  expect(tasks.success && tasks.data.workflow_runs?.[0]?.id).toBe(7)
  const runs = await forgejoActionRunsList(transport.data, "alice/demo", { workflowId: "build.yml" })
  expect(runs.success && runs.data.workflow_runs?.[0]?.status).toBe("success")
  const run = await forgejoActionRunGet(transport.data, "alice/demo", 7)
  expect(run.success && run.data.title).toBe("Build")
  const variables = await forgejoActionVariableList(transport.data, "alice/demo")
  expect(variables.success && variables.data[0]?.name).toBe("GREETING")
  await forgejoActionVariableCreate(transport.data, "alice/demo", { name: "NEW", data: "value" })
  await forgejoActionVariableCreate(transport.data, "alice/demo", "EXISTS", "replacement", true)
  await forgejoActionVariableDelete(transport.data, "alice/demo", "NEW")
  const secrets = await forgejoActionSecretList(transport.data, "alice/demo")
  expect(secrets.success && secrets.data[0]?.name).toBe("TOKEN")
  await forgejoActionSecretCreate(transport.data, "alice/demo", { name: "TOKEN", data: "secret" })
  await forgejoActionSecretDelete(transport.data, "alice/demo", "TOKEN")
  await forgejoActionWorkflowDispatch(transport.data, "alice/demo", "build.yml", "main", { greeting: "hello" })

  const dispatch = calls.find((call) => call.path.endsWith("/dispatches"))
  expect(dispatch?.body).toEqual({ inputs: { greeting: "hello" }, ref: "main", return_run_info: false })
  const forced = calls.find((call) => call.path.endsWith("/variables/EXISTS") && call.method === "PUT")
  expect(forced?.body).toEqual({ name: null, value: "replacement" })
})

test("actions options validate before making requests", async () => {
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
  const result = await forgejoActionSecretCreate(transport.data, "alice/demo", { name: "", data: "secret" })
  expect(result.success).toBe(false)
  expect(requestCount).toBe(0)
})
