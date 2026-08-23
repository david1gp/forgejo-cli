import { expect, test } from "bun:test"
import { forgejoBaseUrlParse, forgejoHostParse } from "../src/index.js"

test("normalizes a Forgejo host to an HTTPS base URL", () => {
  const result = forgejoBaseUrlParse("git.contentoren.de/forgejo")

  expect(result).toEqual({ success: true, data: "https://git.contentoren.de/forgejo/" })
})

test("extracts the host from a base URL", () => {
  const result = forgejoHostParse("https://git.contentoren.de/forgejo/")

  expect(result).toEqual({ success: true, data: "git.contentoren.de" })
})

test("returns a Result error for an invalid base URL", () => {
  const result = forgejoBaseUrlParse("https://")

  expect(result.success).toBe(false)
  if (!result.success) expect(result.op).toBe("forgejoBaseUrlParse")
})
