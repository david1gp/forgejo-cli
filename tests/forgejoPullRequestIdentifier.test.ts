import { expect, test } from "bun:test"
import { forgejoPullRequestIdentifierParse, forgejoPullRequestNumberParse } from "../src/index.js"

test("parses pull request numbers and parent syntax", () => {
  expect(forgejoPullRequestNumberParse("12")).toEqual({
    success: true,
    data: { number: 12, parent: false },
  })
  expect(forgejoPullRequestNumberParse("^7")).toEqual({
    success: true,
    data: { number: 7, parent: true },
  })
})

test("parses repository-qualified parent pull requests", () => {
  expect(forgejoPullRequestIdentifierParse("adaptive/forgejo-cli#^7")).toEqual({
    success: true,
    data: {
      repo: { owner: "adaptive", name: "forgejo-cli" },
      number: 7,
      parent: true,
    },
  })
})
