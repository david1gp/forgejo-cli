import { expect, test } from "bun:test"
import {
  forgejoIssueAssigneeAdd,
  forgejoIssueBlockedByAdd,
  forgejoIssueBlockedByGet,
  forgejoIssueBlockedByRemove,
  forgejoIssueBodyEdit,
  forgejoIssueCommentCreate,
  forgejoIssueCommentGet,
  forgejoIssueCommentsList,
  forgejoIssueCreate,
  forgejoIssueDependenciesGet,
  forgejoIssueDependencyAdd,
  forgejoIssueDependencyRemove,
  forgejoIssueGet,
  forgejoIssueLabelsEdit,
  forgejoIssueList,
  forgejoIssueStateEdit,
  forgejoIssueTemplatesGet,
  forgejoIssueTitleEdit,
  forgejoRestTransportCreate,
} from "../src/index.js"

const issueInput = { repo: { owner: "alice", name: "demo" }, number: 7 }
const issue = { number: 7, title: "Demo", body: "Body", state: "open", assignees: [{ login: "alice" }] }

test("issue resources validate, preserve repository values, and use the existing transport", async () => {
  const calls: { url: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = String(input)
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ url, method, ...(body === undefined ? {} : { body }) })
      const path = new URL(url).pathname
      if (path.endsWith("/issue_templates")) return new Response(JSON.stringify([{ file_name: "bug.md", name: "Bug" }]))
      if (path.endsWith("/comments/3")) return new Response(JSON.stringify({ id: 3, body: "one" }))
      if (path.endsWith("/comments") && method === "GET") return new Response(JSON.stringify([{ id: 3, body: "one" }]))
      if (path.endsWith("/comments") && method === "POST") return new Response(JSON.stringify({ id: 4, body: "two" }))
      if (path.endsWith("/dependencies") || path.endsWith("/blocking")) {
        if (method === "GET") return new Response(JSON.stringify([{ number: 9, title: "Related" }]))
        return new Response(null, { status: 204 })
      }
      if (path.endsWith("/labels") && method === "GET")
        return new Response(JSON.stringify([{ id: 4, name: "feature" }]))
      if (path.endsWith("/labels") && method === "POST") return new Response(JSON.stringify([]))
      if (path.includes("/labels/") && method === "DELETE") return new Response(null, { status: 204 })
      if (method === "PATCH") return new Response(JSON.stringify(issue))
      if (method === "POST") return new Response(JSON.stringify({ ...issue, number: 8, title: "Created" }))
      if (method === "GET" && path.endsWith("/issues")) return new Response(JSON.stringify([issue]))
      return new Response(JSON.stringify(issue))
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const created = await forgejoIssueCreate(transport.data, "alice/demo", { title: "Created", body: "Body" })
  expect(created.success && created.data.repo).toEqual({ owner: "alice", name: "demo" })
  const fetched = await forgejoIssueGet(transport.data, issueInput)
  expect(fetched.success && fetched.data.repo).toEqual(issueInput.repo)
  const listed = await forgejoIssueList(transport.data, "alice/demo", { state: "open", labels: ["bug", "urgent"] })
  expect(listed.success && listed.data[0]?.title).toBe("Demo")
  await forgejoIssueTitleEdit(transport.data, issueInput, "Renamed")
  await forgejoIssueBodyEdit(transport.data, issueInput, "Updated")
  await forgejoIssueStateEdit(transport.data, issueInput, "closed")
  await forgejoIssueCommentCreate(transport.data, issueInput, { body: "two" })
  await forgejoIssueCommentsList(transport.data, issueInput)
  await forgejoIssueCommentGet(transport.data, issueInput, 3)
  await forgejoIssueAssigneeAdd(transport.data, issueInput, { users: ["bob"] })
  await forgejoIssueLabelsEdit(transport.data, issueInput, { add: [4], remove: ["bug"] })
  const templates = await forgejoIssueTemplatesGet(transport.data, "alice/demo")
  expect(templates.success && templates.data[0]?.file_name).toBe("bug.md")
  await forgejoIssueDependencyAdd(transport.data, issueInput, { repo: { owner: "other", name: "repo" }, number: 9 })
  await forgejoIssueDependencyRemove(transport.data, issueInput, "other/repo#9")
  const dependencies = await forgejoIssueDependenciesGet(transport.data, issueInput)
  expect(dependencies.success && dependencies.data[0]?.repo).toEqual(issueInput.repo)
  await forgejoIssueBlockedByAdd(transport.data, issueInput, { number: 10 })
  await forgejoIssueBlockedByRemove(transport.data, issueInput, { number: 10 })
  const blockedBy = await forgejoIssueBlockedByGet(transport.data, issueInput)
  expect(blockedBy.success && blockedBy.data[0]?.number).toBe(9)

  const dependencyCall = calls.find((call) => call.url.endsWith("/dependencies") && call.method === "POST")
  expect(dependencyCall?.body).toEqual({ index: 9, owner: "other", repo: "repo" })
  const labelCall = calls.find((call) => call.url.endsWith("/labels") && call.method === "POST")
  expect(labelCall?.body).toEqual({ labels: [4] })
})

test("issue resources return validation errors without making requests", async () => {
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
  const result = await forgejoIssueCreate(transport.data, "alice/demo", { title: "" })
  expect(result.success).toBe(false)
  expect(requestCount).toBe(0)
})
