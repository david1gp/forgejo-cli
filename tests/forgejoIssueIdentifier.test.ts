import { expect, test } from "bun:test"
import { forgejoIssueIdentifierParse } from "../src/index.js"

test("parses local and repository-qualified issue identifiers", () => {
  expect(forgejoIssueIdentifierParse("42")).toEqual({ success: true, data: { number: 42 } })
  expect(forgejoIssueIdentifierParse("git.contentoren.de/adaptive/forgejo-cli#42")).toEqual({
    success: true,
    data: {
      repo: { host: "git.contentoren.de", owner: "adaptive", name: "forgejo-cli" },
      number: 42,
    },
  })
})

test("returns a Result error for an invalid issue number", () => {
  const result = forgejoIssueIdentifierParse("adaptive/forgejo-cli#nope")

  expect(result.success).toBe(false)
})
