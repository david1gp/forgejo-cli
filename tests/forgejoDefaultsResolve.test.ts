import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { forgejoConfigurationSave, forgejoDefaultsResolve } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test("combines persisted defaults with environment overrides without merging host roles", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_host: "persisted.example.test",
      ssh_base: "ssh://git@persisted.example.test",
      default_org: "persisted-team",
      default_remote: "persisted-upstream",
      user: "persisted-user",
    },
    { path },
  )

  const resolved = await forgejoDefaultsResolve({
    cwd: "/work/example-repository",
    env: {
      FJ_HOST: "forced.example.test",
      FJ_FALLBACK_HOST: "fallback.example.test",
      FJ_SSH_BASE: "ssh://git@environment.example.test",
      FJ_ORG: "environment-team",
      FJ_REMOTE: "environment-upstream",
      FJ_USER: "alice",
    },
    path,
  })

  expect(resolved).toEqual({
    success: true,
    data: {
      host: "forced.example.test",
      fallbackHost: "fallback.example.test",
      defaultHost: "persisted.example.test",
      sshBase: "ssh://git@environment.example.test",
      user: "alice",
      organization: "environment-team",
      remote: "environment-upstream",
      repository: "example-repository",
    },
  })
})

test("uses persisted non-host defaults when environment values are absent and never persists a user", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_host: "persisted.example.test",
      ssh_base: "ssh://git@persisted.example.test",
      default_org: "persisted-team",
      default_remote: "persisted-upstream",
      user: "persisted-user",
    },
    { path },
  )

  const resolved = await forgejoDefaultsResolve({
    cwd: "/work/example-repository",
    env: {
      FJ_HOST: " ",
      FJ_FALLBACK_HOST: " ",
      FJ_SSH_BASE: "\t",
      FJ_ORG: "\n",
      FJ_REMOTE: " ",
    },
    path,
  })

  expect(resolved).toEqual({
    success: true,
    data: {
      defaultHost: "persisted.example.test",
      sshBase: "ssh://git@persisted.example.test",
      organization: "persisted-team",
      remote: "persisted-upstream",
      repository: "example-repository",
    },
  })
})

test("returns an empty resolved default set when the configuration file is absent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)

  const resolved = await forgejoDefaultsResolve({
    cwd: directory,
    env: {},
    path: join(directory, "missing.json"),
  })

  expect(resolved).toEqual({ success: true, data: { repository: directory.split("/").at(-1) } })
})
