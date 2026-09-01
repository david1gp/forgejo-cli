import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createResult, createResultError } from "#result"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"
import type { ForgejoFetch } from "../src/http/forgejoRestTransportCreate.js"
import { type ForgejoProcessCommand, forgejoConfigurationSave } from "../src/index.js"

const env = { FORGEJO_TOKEN: "test-token" }
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

function outputCapture() {
  const output: string[] = []
  return {
    output,
    outputWrite: (value: string) => {
      output.push(value)
      return createResult(null)
    },
  }
}

test("runs repo view through explicit repository and host context with JSON output", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo", description: "A demo repository" }), {
      status: 200,
    })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "view", "owner/demo"],
    {
      env,
      fetch,
      execute: async () => {
        throw new Error("explicit repository context must not inspect Git")
      },
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual(["https://forgejo.example.test/api/v1/repos/owner/demo"])
  expect(JSON.parse(capture.output.join(""))).toMatchObject({ full_name: "owner/demo" })
})

test("resolves CLI host defaults in order and lets --host win", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-host-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_host: "persisted.example.test" }, { path: configurationPath })
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo" }), { status: 200 })
  }

  const environment = {
    ...env,
    FORGEJO_CONFIG_FILE: configurationPath,
    FJ_HOST: "primary.example.test",
    FJ_FALLBACK_HOST: "fallback.example.test",
  }
  const primary = await forgejoCliRun(["repo", "view", "owner/demo"], {
    env: environment,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const explicit = await forgejoCliRun(["--host", "explicit.example.test", "repo", "view", "owner/demo"], {
    env: environment,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const fallback = await forgejoCliRun(["repo", "view", "owner/demo"], {
    env: { ...environment, FJ_HOST: "  " },
    fetch,
    execute: async () => createResultError("test", "not a Git repository"),
    outputWrite: outputCapture().outputWrite,
  })
  const persisted = await forgejoCliRun(["repo", "view", "owner/demo"], {
    env: { ...environment, FJ_HOST: " ", FJ_FALLBACK_HOST: " " },
    execute: async () => createResultError("test", "not a Git repository"),
    fetch,
    outputWrite: outputCapture().outputWrite,
  })

  expect(primary.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(fallback.success).toBe(true)
  expect(persisted.success).toBe(true)
  expect(requests).toEqual([
    "https://primary.example.test/api/v1/repos/owner/demo",
    "https://explicit.example.test/api/v1/repos/owner/demo",
    "https://fallback.example.test/api/v1/repos/owner/demo",
    "https://persisted.example.test/api/v1/repos/owner/demo",
  ])
})

test("selects FJ_REMOTE in the CLI while an explicit --remote takes precedence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-remote-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_remote: "mirror" }, { path: configurationPath })
  const requests: string[] = []
  const remotes: Record<string, string> = {
    origin: "https://forgejo.example.test/owner/origin.git",
    mirror: "https://forgejo.example.test/owner/mirror.git",
  }
  const execute = async ({ args }: ForgejoProcessCommand) => {
    if (args[0] === "remote" && args.length === 1) return createResult(Object.keys(remotes).join("\n"))
    const url = remotes[args[2] ?? ""]
    return url === undefined ? createResultError("test", "missing remote") : createResult(url)
  }
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ full_name: "owner/repository", name: "repository" }), { status: 200 })
  }

  const persisted = await forgejoCliRun(["repo", "view"], {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
    execute,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const environment = await forgejoCliRun(["repo", "view"], {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath, FJ_REMOTE: "origin" },
    execute,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const explicit = await forgejoCliRun(["repo", "view", "--remote", "mirror"], {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath, FJ_REMOTE: "origin" },
    execute,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })

  expect(persisted.success).toBe(true)
  expect(environment.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/repos/owner/mirror",
    "https://forgejo.example.test/api/v1/repos/owner/origin",
    "https://forgejo.example.test/api/v1/repos/owner/mirror",
  ])
})

test("uses organization precedence for omitted repository-owner targets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-repo-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_org: "persisted-team" }, { path: configurationPath })
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ name: "demo", full_name: "team/demo" }), { status: 201 })
  }
  const persisted = { ...env, FORGEJO_CONFIG_FILE: configurationPath }
  const environment = { ...persisted, FJ_ORG: "team" }

  const defaulted = await forgejoCliRun(["--host", "https://forgejo.example.test", "repo", "create", "demo"], {
    env: persisted,
    fetch,
    outputWrite: outputCapture().outputWrite,
  })
  const environmentDefaulted = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo"],
    {
      env: environment,
      fetch,
      outputWrite: outputCapture().outputWrite,
    },
  )
  const explicit = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--organization", "explicit"],
    {
      env: environment,
      fetch,
      outputWrite: outputCapture().outputWrite,
    },
  )

  expect(defaulted.success).toBe(true)
  expect(environmentDefaulted.success).toBe(true)
  expect(explicit.success).toBe(true)
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/orgs/persisted-team/repos",
    "https://forgejo.example.test/api/v1/orgs/team/repos",
    "https://forgejo.example.test/api/v1/orgs/explicit/repos",
  ])
})

test("uses the configured organization and current directory for an omitted CLI repository", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-cwd-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    { hosts: {}, default_host: "forgejo.example.test", default_org: "persisted-team" },
    { path: configurationPath },
  )
  const requests: string[] = []
  const previousDirectory = process.cwd()
  try {
    const result = await forgejoCliRun(["--cwd", directory, "repo", "view"], {
      env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
      execute: async () => createResultError("test", "not a Git repository"),
      fetch: async (input) => {
        requests.push(String(input))
        return new Response(JSON.stringify({ full_name: `persisted-team/${directory.split("/").at(-1)}` }), {
          status: 200,
        })
      },
      outputWrite: outputCapture().outputWrite,
      stdoutIsTty: false,
    })

    expect(result.success).toBe(true)
  } finally {
    process.chdir(previousDirectory)
  }
  expect(requests).toEqual([`https://forgejo.example.test/api/v1/repos/persisted-team/${directory.split("/").at(-1)}`])
})

test("uses organization precedence for repository forks and one-part migrations", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-repo-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_org: "persisted-team" }, { path: configurationPath })
  const requests: { path: string; body: unknown }[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    const url = new URL(String(input))
    requests.push({ path: url.pathname, body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined })
    return new Response(JSON.stringify({ name: "demo", full_name: "persisted-team/demo" }), { status: 201 })
  }
  const options = {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
    fetch,
    outputWrite: outputCapture().outputWrite,
  }
  const environmentOptions = { ...options, env: { ...options.env, FJ_ORG: "environment-team" } }

  const forked = await forgejoCliRun(["--host", "https://forgejo.example.test", "repo", "fork", "source/demo"], options)
  const migrated = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "migrate", "https://git.example.test/source/demo.git", "demo"],
    options,
  )
  const environmentForked = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "fork", "source/demo"],
    environmentOptions,
  )
  const environmentMigrated = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "migrate", "https://git.example.test/source/demo.git", "demo"],
    environmentOptions,
  )
  const explicitForked = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "fork", "source/demo", "--organization", "explicit-team"],
    environmentOptions,
  )
  const explicitMigrated = await forgejoCliRun(
    [
      "--host",
      "https://forgejo.example.test",
      "repo",
      "migrate",
      "https://git.example.test/source/demo.git",
      "explicit-team/demo",
    ],
    environmentOptions,
  )

  expect(forked.success).toBe(true)
  expect(migrated.success).toBe(true)
  expect(environmentForked.success).toBe(true)
  expect(environmentMigrated.success).toBe(true)
  expect(explicitForked.success).toBe(true)
  expect(explicitMigrated.success).toBe(true)
  expect(requests).toEqual([
    {
      path: "/api/v1/repos/source/demo/forks",
      body: { organization: "persisted-team" },
    },
    {
      path: "/api/v1/repos/migrate",
      body: {
        clone_addr: "https://git.example.test/source/demo.git",
        repo_name: "demo",
        repo_owner: "persisted-team",
        mirror: false,
        private: false,
      },
    },
    {
      path: "/api/v1/repos/source/demo/forks",
      body: { organization: "environment-team" },
    },
    {
      path: "/api/v1/repos/migrate",
      body: {
        clone_addr: "https://git.example.test/source/demo.git",
        repo_name: "demo",
        repo_owner: "environment-team",
        mirror: false,
        private: false,
      },
    },
    {
      path: "/api/v1/repos/source/demo/forks",
      body: { organization: "explicit-team" },
    },
    {
      path: "/api/v1/repos/migrate",
      body: {
        clone_addr: "https://git.example.test/source/demo.git",
        repo_name: "demo",
        repo_owner: "explicit-team",
        mirror: false,
        private: false,
      },
    },
  ])
})

test("uses authenticated personal namespaces when --no-org bypasses organization defaults", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-repo-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    { hosts: {}, default_org: "persisted-team", user: "persisted-user" },
    { path: configurationPath },
  )
  const requests: { path: string; body: unknown; authorization: string | null }[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    const url = new URL(String(input))
    requests.push({
      path: url.pathname,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      authorization: new Headers(init?.headers).get("Authorization"),
    })
    return new Response(JSON.stringify({ name: "demo", full_name: "alice/demo" }), { status: 201 })
  }
  const options = {
    env: {
      ...env,
      FJ_ORG: "environment-team",
      FJ_USER: "environment-target",
      FORGEJO_CONFIG_FILE: configurationPath,
    },
    fetch,
    outputWrite: outputCapture().outputWrite,
  }

  const created = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--no-org"],
    options,
  )
  const forked = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "fork", "source/demo", "--no-org"],
    options,
  )
  const migrated = await forgejoCliRun(
    [
      "--host",
      "https://forgejo.example.test",
      "repo",
      "migrate",
      "https://git.example.test/source/demo.git",
      "demo",
      "--no-org",
    ],
    options,
  )

  expect(created.success).toBe(true)
  expect(forked.success).toBe(true)
  expect(migrated.success).toBe(true)
  expect(requests).toEqual([
    {
      path: "/api/v1/user/repos",
      body: { name: "demo", private: false, auto_init: false, default_branch: "main", readme: "", template: false },
      authorization: "token test-token",
    },
    {
      path: "/api/v1/repos/source/demo/forks",
      body: {},
      authorization: "token test-token",
    },
    {
      path: "/api/v1/repos/migrate",
      body: {
        clone_addr: "https://git.example.test/source/demo.git",
        repo_name: "demo",
        mirror: false,
        private: false,
      },
      authorization: "token test-token",
    },
  ])
})

test("uses a dotenv personal namespace while preserving an explicit CLI organization", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-env-personal-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_org: "persisted-team" }, { path: configurationPath })
  await writeFile(join(directory, ".env"), "FJ_NO_ORG=true\nFJ_ORG=dotenv-team\nUNRELATED_SECRET=must-not-leak\n")
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(JSON.stringify({ name: "demo", full_name: "alice/demo" }), { status: 201 })
  }
  const previousDirectory = process.cwd()
  try {
    const options = {
      env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
      fetch,
      outputWrite: outputCapture().outputWrite,
      stdoutIsTty: false,
    }
    const personal = await forgejoCliRun(
      ["--cwd", directory, "--host", "https://forgejo.example.test", "repo", "create", "demo"],
      options,
    )
    const explicit = await forgejoCliRun(
      [
        "--cwd",
        directory,
        "--host",
        "https://forgejo.example.test",
        "repo",
        "create",
        "demo",
        "--organization",
        "explicit-team",
      ],
      options,
    )

    expect(personal.success).toBe(true)
    expect(explicit.success).toBe(true)
  } finally {
    process.chdir(previousDirectory)
  }
  expect(requests).toEqual([
    "https://forgejo.example.test/api/v1/user/repos",
    "https://forgejo.example.test/api/v1/orgs/explicit-team/repos",
  ])
})

test("uses FJ_SSH_BASE for repository creation remotes", async () => {
  const commands: { command: string; args: readonly string[] }[] = []
  const result = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--remote", "origin", "--ssh"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch: async () =>
        new Response(
          JSON.stringify({
            name: "demo",
            full_name: "team/demo",
            clone_url: "https://forgejo.example.test/team/demo.git",
            ssh_url: "ssh://git@forgejo.example.test/team/demo.git",
          }),
          { status: 201 },
        ),
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: outputCapture().outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(commands).toEqual([
    {
      command: "git",
      args: ["remote", "add", "origin", "ssh://git@ssh.git.contentoren.de:2222/team/demo.git"],
    },
  ])
})

test("uses the configured SSH default for repository creation and honors explicit HTTPS", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-repo-create-ssh-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_ssh: ["forgejo.example.test"] }, { path: configurationPath })
  const commands: string[][] = []
  const resultOptions = {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
    fetch: async () =>
      new Response(
        JSON.stringify({
          name: "demo",
          full_name: "owner/demo",
          clone_url: "https://forgejo.example.test/owner/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
        }),
        { status: 201 },
      ),
    execute: async ({ args }: ForgejoProcessCommand) => {
      commands.push([...args])
      return createResult("")
    },
    outputWrite: outputCapture().outputWrite,
  }

  const configuredDefault = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--remote", "origin"],
    resultOptions,
  )
  const explicitHttps = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--remote", "origin", "--no-ssh"],
    resultOptions,
  )

  expect(configuredDefault.success).toBe(true)
  expect(explicitHttps.success).toBe(true)
  expect(commands).toEqual([
    ["remote", "add", "origin", "ssh://git@forgejo.example.test/owner/demo.git"],
    ["remote", "add", "origin", "https://forgejo.example.test/owner/demo.git"],
  ])
})

test("uses persisted ssh_base for repository creation and clone remotes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-repo-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    { hosts: {}, ssh_base: "ssh://git@persisted.example.test:2222" },
    { path: configurationPath },
  )
  const commands: { command: string; args: readonly string[] }[] = []
  const fetch: ForgejoFetch = async () =>
    new Response(
      JSON.stringify({
        name: "demo",
        full_name: "owner/demo",
        clone_url: "https://forgejo.example.test/owner/demo.git",
        ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
        parent: {
          clone_url: "https://forgejo.example.test/upstream/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/upstream/demo.git",
        },
      }),
      { status: 200 },
    )
  const options = {
    env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
    fetch,
    execute: async (input: ForgejoProcessCommand) => {
      commands.push({ command: input.command, args: [...input.args] })
      return createResult("")
    },
    outputWrite: outputCapture().outputWrite,
  }

  const created = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "create", "demo", "--remote", "origin", "--ssh"],
    options,
  )
  const cloned = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "owner/demo", "/tmp/demo"],
    options,
  )

  expect(created.success).toBe(true)
  expect(cloned.success).toBe(true)
  expect(commands).toEqual([
    {
      command: "git",
      args: ["remote", "add", "origin", "ssh://git@persisted.example.test:2222/owner/demo.git"],
    },
    {
      command: "git",
      args: ["clone", "ssh://git@persisted.example.test:2222/owner/demo.git", "/tmp/demo"],
    },
    {
      command: "git",
      args: ["remote", "add", "upstream", "ssh://git@persisted.example.test:2222/upstream/demo.git"],
    },
  ])
})

test("resolves SSH clone URLs from FJ_SSH_BASE, persisted ssh_base, then the server URL", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-ssh-"))
  temporaryDirectories.push(directory)
  const persistedPath = join(directory, "persisted.json")
  const serverPath = join(directory, "server.json")
  await forgejoConfigurationSave(
    {
      hosts: {},
      default_ssh: ["forgejo.example.test"],
      ssh_base: "ssh://git@persisted.example.test:2222",
    },
    { path: persistedPath },
  )
  await forgejoConfigurationSave({ hosts: {} }, { path: serverPath })

  const commands: string[][] = []
  const fetch: ForgejoFetch = async () =>
    new Response(
      JSON.stringify({
        full_name: "owner/demo",
        name: "demo",
        clone_url: "https://forgejo.example.test/owner/demo.git",
        ssh_url: "ssh://git@server.example.test:2222/owner/demo.git",
      }),
      { status: 200 },
    )
  const common = {
    fetch,
    execute: async (input: ForgejoProcessCommand) => {
      commands.push([...input.args])
      return createResult("")
    },
    outputWrite: outputCapture().outputWrite,
  }

  const explicit = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--no-ssh", "owner/demo"],
    {
      ...common,
      env: {
        ...env,
        FORGEJO_CONFIG_FILE: persistedPath,
        FJ_SSH_BASE: "ssh://git@environment.example.test:2222",
      },
    },
  )
  const environment = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "owner/demo"],
    {
      ...common,
      env: {
        ...env,
        FORGEJO_CONFIG_FILE: persistedPath,
        FJ_SSH_BASE: "ssh://git@environment.example.test:2222",
      },
    },
  )
  const persisted = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "owner/demo"],
    {
      ...common,
      env: { ...env, FORGEJO_CONFIG_FILE: persistedPath },
    },
  )
  const configuredDefault = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "owner/demo"],
    {
      ...common,
      env: { ...env, FORGEJO_CONFIG_FILE: persistedPath },
    },
  )
  const server = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "owner/demo"],
    {
      ...common,
      env: { ...env, FORGEJO_CONFIG_FILE: serverPath },
    },
  )

  expect(explicit.success).toBe(true)
  expect(environment.success).toBe(true)
  expect(persisted.success).toBe(true)
  expect(configuredDefault.success).toBe(true)
  expect(server.success).toBe(true)
  expect(commands).toEqual([
    ["clone", "https://forgejo.example.test/owner/demo.git", "./demo"],
    ["clone", "ssh://git@environment.example.test:2222/owner/demo.git", "./demo"],
    ["clone", "ssh://git@persisted.example.test:2222/owner/demo.git", "./demo"],
    ["clone", "ssh://git@persisted.example.test:2222/owner/demo.git", "./demo"],
    ["clone", "ssh://git@server.example.test:2222/owner/demo.git", "./demo"],
  ])
})

test("lets explicit --ssh override a persisted HTTPS clone default", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-ssh-override-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_ssh: ["other.example.test"] }, { path: configurationPath })
  const commands: string[][] = []
  const result = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "owner/demo"],
    {
      env: { ...env, FORGEJO_CONFIG_FILE: configurationPath },
      fetch: async () =>
        new Response(
          JSON.stringify({
            full_name: "owner/demo",
            name: "demo",
            clone_url: "https://forgejo.example.test/owner/demo.git",
            ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
          }),
          { status: 200 },
        ),
      execute: async ({ args }) => {
        commands.push([...args])
        return createResult("")
      },
      outputWrite: outputCapture().outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(commands).toEqual([["clone", "ssh://git@forgejo.example.test/owner/demo.git", "./demo"]])
})

test("keeps omitted repository targets available for runtime fallback resolution", () => {
  const view = forgejoCliParse(["repo", "view"], { stdoutIsTty: false })
  expect(view.success).toBe(true)
  if (view.success) expect(view.data).toMatchObject({ kind: "repo-view", repository: undefined })

  const create = forgejoCliParse(["repo", "create", "demo"], { stdoutIsTty: false })
  expect(create.success).toBe(true)
  if (create.success) expect(create.data).toMatchObject({ kind: "repo-create", organization: undefined })
})

test("parses --no-org for repository create, fork, and one-part migrate", () => {
  const create = forgejoCliParse(["repo", "create", "demo", "--no-org"], { stdoutIsTty: false })
  const fork = forgejoCliParse(["repo", "fork", "source/demo", "--no-org"], { stdoutIsTty: false })
  const migrate = forgejoCliParse(["repo", "migrate", "https://git.example.test/source/demo.git", "demo", "--no-org"], {
    stdoutIsTty: false,
  })

  expect(create.success).toBe(true)
  if (create.success) expect(create.data).toMatchObject({ kind: "repo-create", noOrg: true })
  expect(fork.success).toBe(true)
  if (fork.success) expect(fork.data).toMatchObject({ kind: "repo-fork", noOrg: true })
  expect(migrate.success).toBe(true)
  if (migrate.success) expect(migrate.data).toMatchObject({ kind: "repo-migrate", noOrg: true, repoName: "demo" })
})

test("rejects --no-org with an explicit organization or migrate destination owner", () => {
  const conflicts = [
    ["repo", "create", "demo", "--no-org", "--organization", "team"],
    ["repo", "fork", "source/demo", "--no-org", "--organization", "team"],
    ["repo", "migrate", "https://git.example.test/source/demo.git", "team/demo", "--no-org"],
  ]

  for (const args of conflicts) {
    const parsed = forgejoCliParse(args, { stdoutIsTty: false })
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(parsed.errorMessage).toContain("--no-org cannot be used")
  }
})

test("requires destructive confirmation in non-interactive mode and accepts --force", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(null, { status: 204 })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "delete", "--force", "owner/demo"],
    {
      env,
      fetch,
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual(["https://forgejo.example.test/api/v1/repos/owner/demo"])
  expect(JSON.parse(capture.output.join(""))).toEqual({ deleted: true, repository: "owner/demo" })
})

test("uses injectable local process and browser behavior for clone and browse", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input) => {
    requests.push(String(input))
    return new Response(
      JSON.stringify({
        full_name: "owner/demo",
        name: "demo",
        clone_url: "https://forgejo.example.test/owner/demo.git",
        ssh_url: "ssh://git@forgejo.example.test/owner/demo.git",
        parent: {
          clone_url: "https://forgejo.example.test/upstream/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/upstream/demo.git",
        },
      }),
      { status: 200 },
    )
  }
  const commands: { command: string; args: readonly string[] }[] = []
  const capture = outputCapture()
  const clone = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--ssh", "-I", "/tmp/key", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(clone.success).toBe(true)
  expect(commands).toEqual([
    {
      command: "git",
      args: [
        "clone",
        "-c",
        "core.sshCommand=ssh -i /tmp/key",
        "ssh://git@ssh.git.contentoren.de:2222/owner/demo.git",
        "/tmp/demo",
      ],
    },
    {
      command: "git",
      args: ["remote", "add", "upstream", "ssh://git@ssh.git.contentoren.de:2222/upstream/demo.git"],
    },
  ])

  commands.length = 0
  const defaultSsh = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(defaultSsh.success).toBe(true)
  expect(commands).toEqual([
    { command: "git", args: ["clone", "https://forgejo.example.test/owner/demo.git", "/tmp/demo"] },
    {
      command: "git",
      args: ["remote", "add", "upstream", "https://forgejo.example.test/upstream/demo.git"],
    },
  ])

  commands.length = 0
  const noSsh = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "clone", "--no-ssh", "owner/demo", "/tmp/demo"],
    {
      env: { ...env, FJ_SSH_BASE: "ssh://git@ssh.git.contentoren.de:2222" },
      fetch,
      execute: async (input) => {
        commands.push({ command: input.command, args: [...input.args] })
        return createResult("")
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(noSsh.success).toBe(true)
  expect(commands).toEqual([
    { command: "git", args: ["clone", "https://forgejo.example.test/owner/demo.git", "/tmp/demo"] },
    {
      command: "git",
      args: ["remote", "add", "upstream", "https://forgejo.example.test/upstream/demo.git"],
    },
  ])

  let opened = ""
  const browse = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "browse", "owner/demo"],
    {
      env,
      fetch,
      browserOpen: async (url) => {
        opened = url
        return createResult(null)
      },
      outputWrite: capture.outputWrite,
    },
  )
  expect(browse.success).toBe(true)
  expect(opened).toBe("https://forgejo.example.test/owner/demo")
  expect(requests).toHaveLength(3)
})

test("parses repository status lists and pull-request unit options", () => {
  const status = forgejoCliParse(["--host", "forgejo.example.test", "repo", "star-status", "--list"], {
    stdoutIsTty: false,
  })
  expect(status.success).toBe(true)
  if (status.success)
    expect(status.data).toMatchObject({ kind: "repo-star-status", list: true, host: "forgejo.example.test" })

  const units = forgejoCliParse(
    ["repo", "units", "owner/demo", "prs", "--allow-rebase", "false", "--default-merge-style", "squash"],
    { stdoutIsTty: false },
  )
  expect(units.success).toBe(true)
  if (units.success)
    expect(units.data).toMatchObject({
      kind: "repo-units",
      repository: "owner/demo",
      unit: "prs",
      options: { allowRebase: false, defaultMergeStyle: "squash" },
    })
})

test("parses repository avatar options and rejects mutually exclusive operations", () => {
  const upload = forgejoCliParse(["repo", "edit", "owner/demo", "-A", "avatar.png"], { stdoutIsTty: false })
  expect(upload).toEqual({
    success: true,
    data: {
      kind: "repo-edit",
      repository: "owner/demo",
      options: { avatar: "avatar.png" },
      remote: undefined,
      host: undefined,
      cwd: undefined,
      style: "minimal",
    },
  })

  const conflict = forgejoCliParse(["repo", "edit", "owner/demo", "--avatar", "avatar.png", "--unset-avatar"], {
    stdoutIsTty: false,
  })
  expect(conflict.success).toBe(false)
  if (!conflict.success) expect(conflict.errorMessage).toContain("cannot be used with --unset-avatar")
})

test("uploads a repository avatar with injectable binary file reading and Forgejo base64 JSON", async () => {
  const requests: { method: string; path: string; body?: unknown }[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    const url = new URL(String(input))
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
    requests.push({ method: init?.method ?? "GET", path: url.pathname, ...(body === undefined ? {} : { body }) })
    if (init?.method === "POST") return new Response(null, { status: 204 })
    return new Response(JSON.stringify({ full_name: "owner/demo", name: "demo" }), { status: 200 })
  }
  const capture = outputCapture()
  const result = await forgejoCliRun(
    [
      "--json",
      "--host",
      "https://forgejo.example.test",
      "repo",
      "edit",
      "owner/demo",
      "--description",
      "Demo",
      "--avatar",
      "avatar.png",
    ],
    {
      env,
      fetch,
      fileRead: async (path, encoding) => {
        expect(path).toBe("avatar.png")
        expect(encoding).toBe("binary")
        return createResult(new Uint8Array([0, 1, 255]))
      },
      outputWrite: capture.outputWrite,
    },
  )

  expect(result.success).toBe(true)
  expect(requests).toEqual([
    { method: "PATCH", path: "/api/v1/repos/owner/demo", body: { description: "Demo" } },
    { method: "POST", path: "/api/v1/repos/owner/demo/avatar", body: { image: "AAH/" } },
  ])
  expect(JSON.parse(capture.output.join(""))).toMatchObject({ full_name: "owner/demo" })
})

test("unsets a repository avatar and reports injected file read errors usefully", async () => {
  const requests: string[] = []
  const fetch: ForgejoFetch = async (input, init) => {
    requests.push(`${init?.method ?? "GET"} ${String(input)}`)
    return new Response(null, { status: 204 })
  }
  const unset = await forgejoCliRun(
    ["--json", "--host", "https://forgejo.example.test", "repo", "edit", "owner/demo", "--unset-avatar"],
    { env, fetch, outputWrite: outputCapture().outputWrite },
  )
  expect(unset.success).toBe(true)
  expect(requests).toEqual(["DELETE https://forgejo.example.test/api/v1/repos/owner/demo/avatar"])

  const missing = await forgejoCliRun(
    ["--host", "https://forgejo.example.test", "repo", "edit", "owner/demo", "--avatar", "missing.png"],
    {
      env,
      fetch,
      fileRead: async () => createResultError("testFileRead", "No such file"),
      outputWrite: outputCapture().outputWrite,
    },
  )
  expect(missing.success).toBe(false)
  if (!missing.success) expect(missing.errorMessage).toContain("Unable to read avatar file 'missing.png': No such file")
})
