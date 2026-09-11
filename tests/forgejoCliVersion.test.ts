import { expect, test } from "bun:test"
import { forgejoCliRun, forgejoCliVersion } from "../src/index.js"

test("exposes the package version", () => {
  expect(forgejoCliVersion).toBe("0.5.0")
})

test("keeps plain version output unchanged", async () => {
  const output: string[] = []
  const result = await forgejoCliRun(["version"], {
    outputWrite: (value) => {
      output.push(value)
      return { success: true, data: null }
    },
    stdoutIsTty: false,
  })

  expect(result).toEqual({ success: true, data: 0 })
  expect(output.join("")).toBe("fj v0.5.0\n")
})

test("reports package and environment metadata in verbose output", async () => {
  const output: string[] = []
  const result = await forgejoCliRun(["version", "--verbose"], {
    outputWrite: (value) => {
      output.push(value)
      return { success: true, data: null }
    },
    stdoutIsTty: false,
  })

  expect(result).toEqual({ success: true, data: 0 })
  const rendered = output.join("")
  expect(rendered).toContain("fj v0.5.0\n")
  expect(rendered).toContain(
    "description: A Result-based TypeScript Forgejo client library and fj command-line interface.",
  )
  expect(rendered).toContain("author: David Siewert — https://david-siewert.com/")
  expect(rendered).toContain("license: MIT")
  expect(rendered).toContain("project: https://github.com/david1gp/forgejo-cli")
  expect(rendered).toContain("installation type: development checkout")
  expect(rendered).toContain("runtime requirements: node >=22, bun >=1.3.0")
  expect(rendered).toContain(`platform: ${process.platform} ${process.arch} (OS release `)
  expect(rendered).not.toContain("build details:")
  expect(rendered).toMatch(/executable: .+\nexecutable target: .+\n/)
})
