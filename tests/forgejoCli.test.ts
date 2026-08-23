import { expect, test } from "bun:test"
import { forgejoCliCompletionGenerate } from "../src/cli/forgejoCliCompletionGenerate.js"
import { forgejoCliHelpRender } from "../src/cli/forgejoCliHelpRender.js"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"

test("parses global options throughout the first command slice and forces minimal output off a TTY", () => {
  const parsed = forgejoCliParse(
    [
      "auth",
      "login",
      "--token",
      "automation-token",
      "-H",
      "https://forgejo.example.test",
      "-C",
      "/tmp",
      "--style",
      "fancy",
    ],
    { stdoutIsTty: false },
  )

  expect(parsed.success).toBe(true)
  if (!parsed.success) return
  expect(parsed.data).toEqual({
    kind: "auth-login",
    token: "automation-token",
    host: "https://forgejo.example.test",
    cwd: "/tmp",
    style: "minimal",
  })
})

test("parses browser login client-ID overrides without changing token login", () => {
  const parsed = forgejoCliParse(["auth", "login", "--client-id", "installation-client"], { stdoutIsTty: false })
  expect(parsed).toEqual({
    success: true,
    data: {
      kind: "auth-login",
      clientId: "installation-client",
      host: undefined,
      cwd: undefined,
      style: "minimal",
    },
  })
})

test("rejects interactive-only add-token and invalid styles without throwing", () => {
  const missingToken = forgejoCliParse(["auth", "add-token"])
  expect(missingToken.success).toBe(false)
  if (missingToken.success) return
  expect(missingToken.errorMessage).toContain("application token is required")

  const invalidStyle = forgejoCliParse(["--style", "terminal", "version"])
  expect(invalidStyle.success).toBe(false)
  if (invalidStyle.success) return
  expect(invalidStyle.errorMessage).toContain("Expected fancy or minimal")
})

test("completion output follows the implemented command hierarchy for supported shells", () => {
  for (const shell of ["bash", "zsh", "fish", "powershell"]) {
    const output = forgejoCliCompletionGenerate(shell, "fj")
    expect(output).toContain("auth")
    expect(output).toContain("add-token")
    expect(output).toContain("client-id")
    expect(output).toContain("use-ssh")
    expect(output).toContain("completion")
    expect(output).toContain("wiki")
    expect(output).toContain("actions")
    expect(output).toContain("user")
    expect(output).toContain("org")
    expect(output).toContain("gpg")
    expect(output).toContain("team")
    expect(output).toContain("label")
  }
})

test("help and completion expose repository avatar editing", () => {
  const help = forgejoCliHelpRender(["repo", "edit"])
  expect(help).toContain("--avatar <FILE>")
  expect(help).toContain("--unset-avatar")
  for (const shell of ["bash", "zsh", "fish", "powershell"]) {
    const output = forgejoCliCompletionGenerate(shell, "fj")
    expect(output).toContain("avatar")
    expect(output).toContain("unset-avatar")
  }
})
