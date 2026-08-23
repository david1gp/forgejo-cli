import { expect, test } from "bun:test"
import { forgejoSshUrlApplyBase } from "../src/urls/forgejoSshUrlApplyBase.js"

test("joins an SSH URL base with a server-provided repository path", () => {
  expect(
    forgejoSshUrlApplyBase(
      "ssh://git@forgejo.example.test/owner/repository.git",
      "ssh://git@ssh.git.contentoren.de:2222",
    ),
  ).toBe("ssh://git@ssh.git.contentoren.de:2222/owner/repository.git")
})

test("normalizes SCP-style SSH URLs and preserves non-SSH URLs", () => {
  const base = "ssh://git@ssh.git.contentoren.de:2222/"
  expect(forgejoSshUrlApplyBase("git@forgejo.example.test:owner/repository.git", base)).toBe(
    "ssh://git@ssh.git.contentoren.de:2222/owner/repository.git",
  )
  expect(forgejoSshUrlApplyBase("https://forgejo.example.test/owner/repository.git", base)).toBe(
    "https://forgejo.example.test/owner/repository.git",
  )
  expect(forgejoSshUrlApplyBase("ssh://git@forgejo.example.test/owner/repository.git", " ")).toBe(
    "ssh://git@forgejo.example.test/owner/repository.git",
  )
})
