import { expect, test } from "bun:test"
import { forgejoEnvironmentDefaultsResolve } from "../src/index.js"

test("resolves environment defaults and the injectable current directory", () => {
  expect(
    forgejoEnvironmentDefaultsResolve({
      cwd: "/work/example-repository",
      env: {
        FJ_HOST: " forgejo.example.test ",
        FJ_FALLBACK_HOST: "fallback.example.test",
        FJ_SSH_BASE: "ssh://git@ssh.example.test:2222",
        FJ_USER: "alice",
        FJ_ORG: "team",
        FJ_REMOTE: "upstream",
      },
    }),
  ).toEqual({
    host: "forgejo.example.test",
    fallbackHost: "fallback.example.test",
    sshBase: "ssh://git@ssh.example.test:2222",
    user: "alice",
    organization: "team",
    remote: "upstream",
    repository: "example-repository",
  })
})

test("ignores blank values while preserving existing host aliases", () => {
  expect(
    forgejoEnvironmentDefaultsResolve({
      cwd: "/work/example-repository",
      env: {
        FJ_HOST: "  ",
        FORGEJO_BASE_URL: "https://forgejo.example.test",
        FORGEJO_URL: "https://url.example.test",
        FORGEJO_HOST: "host.example.test",
        FJ_FALLBACK_HOST: "\t",
        FJ_SSH_BASE: "",
        FJ_USER: " ",
        FJ_ORG: "\n",
        FJ_REMOTE: "\t",
      },
    }),
  ).toEqual({ host: "https://forgejo.example.test", repository: "example-repository" })
})

test("uses the canonical host before compatibility aliases", () => {
  expect(
    forgejoEnvironmentDefaultsResolve({
      cwd: "/work/example-repository",
      env: {
        FJ_HOST: "fj.example.test",
        FORGEJO_HOST: "legacy.example.test",
      },
    }),
  ).toEqual({ host: "fj.example.test", repository: "example-repository" })
})
