import { expect, test } from "bun:test"
import { forgejoRemoteParse, forgejoRepositoryIdentifierParse } from "../src/index.js"

test("parses repository identifiers with optional hosts and git suffixes", () => {
  expect(forgejoRepositoryIdentifierParse("git.contentoren.de/adaptive/forgejo-cli.git")).toEqual({
    success: true,
    data: {
      host: "git.contentoren.de",
      owner: "adaptive",
      name: "forgejo-cli",
    },
  })
  expect(forgejoRepositoryIdentifierParse("adaptive/forgejo-cli")).toEqual({
    success: true,
    data: { owner: "adaptive", name: "forgejo-cli" },
  })
})

test("parses HTTPS and SCP-like SSH remotes", () => {
  const https = forgejoRemoteParse("https://git.contentoren.de/adaptive/forgejo-cli.git")
  const ssh = forgejoRemoteParse("git@git.contentoren.de:adaptive/forgejo-cli.git")

  expect(https.success && https.data.repository).toEqual({ owner: "adaptive", name: "forgejo-cli" })
  expect(https.success && https.data.baseUrl).toBe("https://git.contentoren.de/")
  expect(ssh.success && ssh.data.protocol).toBe("ssh")
  expect(ssh.success && ssh.data.baseUrl).toBe("https://git.contentoren.de/")
})
