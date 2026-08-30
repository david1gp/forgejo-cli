import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
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

test("uses the nearest directory assignment before the persisted organization", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-directory-defaults-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_org: "persisted-team",
      directory_assignments: {
        "/work": "work-team",
        "/work/project": "local-team",
      },
    },
    { path },
  )

  const resolved = await forgejoDefaultsResolve({
    cwd: "/work/project/repository",
    env: {},
    path,
  })

  expect(resolved.success && resolved.data.organization).toBe("local-team")
})

test("represents a personal directory assignment and lets an environment organization override it", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-directory-personal-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_org: "persisted-team",
      directory_assignments: { "/home/david/personal": null },
    },
    { path },
  )

  const personal = await forgejoDefaultsResolve({ cwd: "/home/david/personal/repository", env: {}, path })
  expect(personal.success && personal.data).toMatchObject({ noOrg: true })
  expect(personal.success && personal.data.organization).toBeUndefined()

  const organization = await forgejoDefaultsResolve({
    cwd: "/home/david/personal/repository",
    env: { FJ_ORG: "environment-team" },
    path,
  })
  expect(organization.success && organization.data).toMatchObject({ organization: "environment-team" })
  expect(organization.success && organization.data.noOrg).toBeUndefined()
})

test("uses dotenv values before directory and persisted defaults while process values win by canonical field", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-env-defaults-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  await mkdir(cwd)
  const path = join(root, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_org: "persisted-team",
      directory_assignments: { [root]: "directory-team" },
    },
    { path },
  )
  await writeFile(
    join(root, ".env"),
    [
      "FJ_HOST=dotenv.example.test",
      "FJ_ORG=dotenv-team",
      "FJ_NO_ORG=false",
      "FJ_USER=dotenv-user",
      "FJ_REMOTE=dotenv-remote",
      "UNRELATED_SECRET=must-not-leak",
    ].join("\n"),
  )

  const environment = {
    FORGEJO_CONFIG_FILE: path,
    FORGEJO_HOST: "process.example.test",
    FJ_ORG: "process-team",
    UNRELATED_SECRET: "process-secret",
  }
  const before = { ...environment }
  const dotenv = await forgejoDefaultsResolve({ cwd, env: { FORGEJO_CONFIG_FILE: path } })
  const process = await forgejoDefaultsResolve({ cwd, env: environment })

  expect(dotenv.success && dotenv.data).toMatchObject({
    host: "dotenv.example.test",
    organization: "dotenv-team",
    noOrg: false,
    user: "dotenv-user",
    remote: "dotenv-remote",
  })
  expect(process.success && process.data).toMatchObject({
    host: "process.example.test",
    organization: "process-team",
    noOrg: false,
  })
  expect(process.success && process.data).not.toHaveProperty("UNRELATED_SECRET")
  expect(environment).toEqual(before)
})

test("uses a dotenv no-org value for the personal namespace over organization defaults", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-env-personal-"))
  temporaryDirectories.push(root)
  const cwd = join(root, "project")
  await mkdir(cwd)
  const path = join(root, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_org: "persisted-team",
      directory_assignments: { [root]: "directory-team" },
    },
    { path },
  )
  await writeFile(join(root, ".env"), "FJ_ORG=dotenv-team\nFJ_NO_ORG=true\n")

  const resolved = await forgejoDefaultsResolve({ cwd, env: { FORGEJO_CONFIG_FILE: path } })

  expect(resolved.success && resolved.data).toMatchObject({ noOrg: true })
  expect(resolved.success && resolved.data.organization).toBeUndefined()
})
