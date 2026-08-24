import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  forgejoConfigurationLoad,
  forgejoConfigurationSave,
  forgejoConfigurationDefaultsLoad,
  forgejoConfigurationDefaultsUpdate,
  forgejoCredentialsAliasSet,
  forgejoCredentialsDefaultSshSet,
  forgejoCredentialsList,
  forgejoCredentialsLogout,
  forgejoCredentialsResolve,
  forgejoCredentialsStore,
} from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test("saves and loads host-keyed tokens with owner-only permissions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  const configuration = { hosts: { "git.example.test": "secret-token" } }

  const saved = await forgejoConfigurationSave(configuration, { path })
  expect(saved).toEqual({ success: true, data: configuration })
  expect((await stat(path)).mode & 0o777).toBe(0o600)
  expect(JSON.parse(await readFile(path, "utf8"))).toEqual(configuration)

  const loaded = await forgejoConfigurationLoad({ path })
  expect(loaded).toEqual({ success: true, data: configuration })
})

test("round-trips persistent defaults without dropping configuration metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  const configuration = {
    hosts: { "git.example.test": "secret-token" },
    oauth_client_ids: { "git.example.test": "oauth-client" },
    aliases: { "ssh.example.test": "git.example.test" },
    default_ssh: ["git.example.test"],
    default_host: "git.example.test",
    ssh_base: "ssh://git@ssh.example.test:2222",
    default_org: "team",
    default_remote: "upstream",
    future_setting: true,
  }

  const saved = await forgejoConfigurationSave(configuration, { path })
  expect(saved).toEqual({ success: true, data: configuration })

  const loaded = await forgejoConfigurationLoad({ path })
  expect(loaded).toEqual({ success: true, data: configuration })

  const defaults = await forgejoConfigurationDefaultsLoad({ path })
  expect(defaults).toEqual({
    success: true,
    data: {
      default_host: "git.example.test",
      ssh_base: "ssh://git@ssh.example.test:2222",
      default_org: "team",
      default_remote: "upstream",
    },
  })

  const updated = await forgejoConfigurationDefaultsUpdate("default_org", "other-team", { path })
  expect(updated).toEqual({
    success: true,
    data: { ...configuration, default_org: "other-team" },
  })
  expect((await stat(path)).mode & 0o777).toBe(0o600)

  expect(await forgejoCredentialsResolve("git.example.test", { configurationPath: path })).toEqual({
    success: true,
    data: "secret-token",
  })
})

test("unsets a persistent default without changing unrelated configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")
  const configuration = {
    hosts: { "git.example.test": "secret-token" },
    default_host: "git.example.test",
    default_remote: "origin",
  }

  await forgejoConfigurationSave(configuration, { path })
  const updated = await forgejoConfigurationDefaultsUpdate("default_host", undefined, { path })

  expect(updated).toEqual({
    success: true,
    data: { hosts: configuration.hosts, default_remote: "origin" },
  })
})

test("rejects unsupported and blank persistent default values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")

  await forgejoConfigurationSave({ hosts: {} }, { path })
  const unsupported = await forgejoConfigurationDefaultsUpdate("host", "git.example.test", { path })
  const blank = await forgejoConfigurationDefaultsUpdate("default_org", "   ", { path })

  expect(unsupported.success).toBe(false)
  expect(blank.success).toBe(false)
})

test("prefers non-persisted host environment credentials over configuration", async () => {
  const result = await forgejoCredentialsResolve("git.example.test", {
    configuration: { hosts: { "git.example.test": "file-token" } },
    env: { FORGEJO_TOKEN_GIT_EXAMPLE_TEST: "automation-token" },
  })

  expect(result).toEqual({ success: true, data: "automation-token" })
})

test("stores an explicit token for one host without persisting environment credentials", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")

  const stored = await forgejoCredentialsStore("https://git.example.test", "stored-token", { configurationPath: path })
  expect(stored).toEqual({ success: true, data: { hosts: { "git.example.test": "stored-token" } } })
  expect(await readFile(path, "utf8")).toContain("stored-token")
})

test("updates tokens and manages compatibility key metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-"))
  temporaryDirectories.push(directory)
  const path = join(directory, "config.json")

  await forgejoCredentialsStore("git.example.test", "old-token", { configurationPath: path })
  const updated = await forgejoCredentialsStore("git.example.test", "new-token", { configurationPath: path })
  expect(updated).toEqual({ success: true, data: { hosts: { "git.example.test": "new-token" } } })

  const ssh = await forgejoCredentialsDefaultSshSet("git.example.test", true, { configurationPath: path })
  expect(ssh.success).toBe(true)
  if (!ssh.success) return
  expect(ssh.data.default_ssh).toEqual(["git.example.test"])

  const alias = await forgejoCredentialsAliasSet("ssh.example.test", "git.example.test", { configurationPath: path })
  expect(alias.success).toBe(true)
  const hosts = await forgejoCredentialsList({ configurationPath: path })
  expect(hosts).toEqual({ success: true, data: ["git.example.test"] })

  const loggedOut = await forgejoCredentialsLogout("git.example.test", { configurationPath: path })
  expect(loggedOut).toEqual({
    success: true,
    data: {
      hosts: {},
      aliases: { "ssh.example.test": "git.example.test" },
      default_ssh: ["git.example.test"],
    },
  })
})
