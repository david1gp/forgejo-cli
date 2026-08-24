import { expect, test } from "bun:test"
import { forgejoCliVersion } from "../src/index.js"

test("exposes the package version", () => {
  expect(forgejoCliVersion).toBe("0.2.0")
})
