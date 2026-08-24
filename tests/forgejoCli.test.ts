import { afterEach, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { forgejoCliCompletionGenerate } from "../src/cli/forgejoCliCompletionGenerate.js"
import { forgejoCliHelpRender } from "../src/cli/forgejoCliHelpRender.js"
import { forgejoCliHostResolve } from "../src/cli/forgejoCliHostResolve.js"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun, forgejoConfigurationSave } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

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

test("repository create, fork, and migrate help expose --no-org", () => {
  for (const command of ["create", "fork", "migrate"]) {
    expect(forgejoCliHelpRender(["repo", command])).toContain("--no-org")
  }
})

test("parses config set and unset invocation variants for each supported key", () => {
  const keys = ["default-host", "ssh-base", "default-org", "default-remote"] as const
  for (const key of keys) {
    expect(forgejoCliParse(["config", "set", key, "value"], { stdoutIsTty: false })).toEqual({
      success: true,
      data: {
        kind: "config-set",
        key,
        value: "value",
        host: undefined,
        cwd: undefined,
        style: "minimal",
      },
    })
    expect(forgejoCliParse(["config", "unset", key], { stdoutIsTty: false })).toEqual({
      success: true,
      data: {
        kind: "config-unset",
        key,
        host: undefined,
        cwd: undefined,
        style: "minimal",
      },
    })
  }
})

test("renders config help and rejects invalid config arguments with parser errors", () => {
  const configHelp = forgejoCliHelpRender(["config"])
  expect(configHelp).toContain("set")
  expect(configHelp).toContain("unset")
  for (const key of ["default-host", "ssh-base", "default-org", "default-remote"]) expect(configHelp).toContain(key)

  expect(forgejoCliParse(["config", "set", "--help"], { stdoutIsTty: false })).toEqual({
    success: true,
    data: { kind: "help", path: ["config", "set"] },
  })
  expect(forgejoCliHelpRender(["config", "unset"])).toContain("KEY")

  for (const args of [
    ["config", "set"],
    ["config", "set", "default-host"],
    ["config", "set", "default-host", "value", "extra"],
    ["config", "unset"],
    ["config", "unset", "default-host", "extra"],
  ]) {
    const parsed = forgejoCliParse(args)
    expect(parsed.success).toBe(false)
    if (!parsed.success) expect(parsed.errorMessage).toContain("Use 'fj --help' for usage.")
  }

  const invalidKey = forgejoCliParse(["config", "set", "host", "value"])
  expect(invalidKey.success).toBe(false)
  if (!invalidKey.success) expect(invalidKey.errorMessage).toContain("Unsupported config key 'host'")
})

test("runs config set and unset for every supported key while preserving unrelated configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-config-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  const initialConfiguration = {
    hosts: { "git.example.test": "secret-token" },
    oauth_client_ids: { "git.example.test": "oauth-client" },
    aliases: { "ssh.example.test": "git.example.test" },
    default_ssh: ["git.example.test"],
    future_setting: true,
  }
  await forgejoConfigurationSave(initialConfiguration, { path: configurationPath })

  const values = {
    "default-host": "git.example.test",
    "ssh-base": "ssh://git@ssh.example.test:2222",
    "default-org": "team",
    "default-remote": "upstream",
  } as const
  const output: string[] = []
  const common = {
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    outputWrite: (value: string) => {
      output.push(value)
      return { success: true as const, data: null }
    },
    stdoutIsTty: false,
  }

  for (const [key, value] of Object.entries(values)) {
    const result = await forgejoCliRun(["config", "set", key, value], common)
    expect(result).toEqual({ success: true, data: 0 })
  }
  expect(JSON.parse(await readFile(configurationPath, "utf8"))).toEqual({
    ...initialConfiguration,
    default_host: "git.example.test",
    ssh_base: "ssh://git@ssh.example.test:2222",
    default_org: "team",
    default_remote: "upstream",
  })
  expect(output).toEqual(["Set default-host\n", "Set ssh-base\n", "Set default-org\n", "Set default-remote\n"])

  output.length = 0
  for (const key of Object.keys(values)) {
    const result = await forgejoCliRun(["config", "unset", key], common)
    expect(result).toEqual({ success: true, data: 0 })
  }
  expect(JSON.parse(await readFile(configurationPath, "utf8"))).toEqual(initialConfiguration)
  expect((await stat(configurationPath)).mode & 0o777).toBe(0o600)
  expect(output).toEqual(["Unset default-host\n", "Unset ssh-base\n", "Unset default-org\n", "Unset default-remote\n"])
})

test("returns a concise persistence error without changing configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-config-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  const configuration = { hosts: { "git.example.test": "secret-token" }, default_org: "team" }
  await forgejoConfigurationSave(configuration, { path: configurationPath })
  const output: string[] = []

  const result = await forgejoCliRun(["config", "set", "default-org", "   "], {
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    outputWrite: (value) => {
      output.push(value)
      return { success: true, data: null }
    },
    stdoutIsTty: false,
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.op).toBe("forgejoCliRun")
    expect(result.errorMessage).toContain("Invalid")
  }
  expect(output).toEqual([])
  expect(JSON.parse(await readFile(configurationPath, "utf8"))).toEqual(configuration)
})

test("uses the persisted default host for host-only CLI resolution", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-host-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave({ hosts: {}, default_host: "persisted.example.test" }, { path: configurationPath })

  const result = await forgejoCliHostResolve({
    cwd: directory,
    env: { FORGEJO_CONFIG_FILE: configurationPath },
  })

  expect(result).toEqual({
    success: true,
    data: { baseUrl: "https://persisted.example.test/", host: "persisted.example.test" },
  })
})

test("preserves authenticated identity and credentials across a CLI default update", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forgejo-cli-auth-"))
  temporaryDirectories.push(directory)
  const configurationPath = join(directory, "config.json")
  await forgejoConfigurationSave(
    {
      hosts: { "forgejo.example.test": "configured-token" },
      default_org: "persisted-team",
      user: "persisted-user",
    },
    { path: configurationPath },
  )

  const updated = await forgejoCliRun(["config", "set", "default-org", "updated-team"], {
    env: { FORGEJO_CONFIG_FILE: configurationPath },
    outputWrite: () => ({ success: true, data: null }),
    stdoutIsTty: false,
  })
  expect(updated.success).toBe(true)

  const requests: { path: string; authorization: string | null }[] = []
  const output: string[] = []
  const whoami = await forgejoCliRun(["--host", "https://forgejo.example.test", "whoami"], {
    env: { FORGEJO_CONFIG_FILE: configurationPath, FJ_USER: "environment-target" },
    fetch: async (input, init) => {
      const url = new URL(String(input))
      requests.push({ path: url.pathname, authorization: new Headers(init?.headers).get("Authorization") })
      return new Response(JSON.stringify({ login: "authenticated-user" }), { status: 200 })
    },
    outputWrite: (value) => {
      output.push(value)
      return { success: true, data: null }
    },
    stdoutIsTty: false,
  })

  expect(whoami.success).toBe(true)
  expect(requests).toEqual([{ path: "/api/v1/user", authorization: "token configured-token" }])
  expect(output.join("")).toBe("authenticated-user @ forgejo.example.test\n")
})
