import { expect, test } from "bun:test"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"
import { createResult } from "#result"

test("parses qualified issue identifiers and body sources without moving the repository", () => {
  const parsed = forgejoCliParse(["issue", "view", "forgejo.example.test/owner/repo#7", "comments"], {
    stdoutIsTty: false,
  })
  expect(parsed.success).toBe(true)
  if (!parsed.success) return
  expect(parsed.data).toMatchObject({
    kind: "issue-view",
    issue: "forgejo.example.test/owner/repo#7",
    view: "comments",
  })

  const comment = forgejoCliParse(["issue", "comment", "--repo", "owner/repo", "7", "--body-file", "-"], {
    stdoutIsTty: false,
  })
  expect(comment.success).toBe(true)
  if (!comment.success) return
  expect(comment.data).toMatchObject({ kind: "issue-comment", issue: "owner/repo#7", bodyFile: "-" })

  const indexedComment = forgejoCliParse(["issue", "view", "owner/repo#7", "comment", "0"], {
    stdoutIsTty: false,
  })
  expect(indexedComment.success).toBe(true)
  if (!indexedComment.success) return
  expect(indexedComment.data).toMatchObject({ kind: "issue-view", view: "comment", comment: 0 })
})

test("views an issue through the library and supports injected output and fetch", async () => {
  const output: string[] = []
  const result = await forgejoCliRun(["issue", "view", "forgejo.example.test/owner/repo#7"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch: async (input) => {
      expect(String(input)).toContain("/api/v1/repos/owner/repo/issues/7")
      return new Response(
        JSON.stringify({
          number: 7,
          title: "A test issue",
          body: "Issue body",
          state: "open",
          user: { login: "author" },
          assignees: [],
          labels: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )
    },
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(result).toEqual({ success: true, data: 0 })
  expect(output.join("")).toContain("A test issue")
  expect(output.join("")).toContain("Issue body")
})

test("uses injected stdin for issue comments and emits JSON", async () => {
  const requests: Request[] = []
  const output: string[] = []
  const result = await forgejoCliRun(["--json", "issue", "comment", "forgejo.example.test/owner/repo#7", "--stdin"], {
    env: { FORGEJO_TOKEN: "test-token" },
    stdinRead: async () => createResult("from stdin"),
    fetch: async (input, init) => {
      requests.push(new Request(String(input), init))
      return new Response(JSON.stringify({ id: 11, body: "from stdin", user: { login: "author" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    },
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(result).toEqual({ success: true, data: 0 })
  expect(requests).toHaveLength(1)
  expect(await requests[0]?.json()).toEqual({ body: "from stdin" })
  expect(JSON.parse(output.join(""))).toMatchObject({ id: 11, body: "from stdin" })
})
