import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { forgejoEnvironmentFileParse, forgejoEnvironmentFileResolve } from "../src/index.js"

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

test("parses only recognized Forgejo variables from dotenv assignments", () => {
  expect(
    forgejoEnvironmentFileParse(`
      FJ_HOST = "https://forgejo.example.test" # primary host
      export FJ_ORG=contentoren
      FJ_NO_ORG=false
      UNRELATED_SECRET=must-not-leak
      # FJ_REMOTE=commented-out
    `),
  ).toEqual({
    FJ_HOST: "https://forgejo.example.test",
    FJ_ORG: "contentoren",
    FJ_NO_ORG: "false",
  })
})

test("parses escaped quoted values and rejects malformed quoted assignments", () => {
  const text = String.raw`
    FJ_HOST="https://forgejo.example.test/?query=\"yes\"" # quoted comment
    FJ_SSH_BASE="ssh://git@forgejo.example.test:2222/path\\with-slash"
    FJ_ORG='team\'s'
    FJ_REMOTE="unterminated
    FJ_USER="valid"unexpected
    FJ_NO_ORG='false' # valid comment
  `

  expect(forgejoEnvironmentFileParse(text)).toEqual({
    FJ_HOST: 'https://forgejo.example.test/?query="yes"',
    FJ_SSH_BASE: "ssh://git@forgejo.example.test:2222/path\\with-slash",
    FJ_ORG: "team's",
    FJ_NO_ORG: "false",
  })
})

test("accepts quoted values followed by whitespace or comments and rejects other trailing content", () => {
  expect(
    forgejoEnvironmentFileParse(
      [
        'FJ_HOST="https://forgejo.example.test"   ',
        "FJ_SSH_BASE='ssh://git@forgejo.example.test:2222'\t# quoted comment",
        'FJ_USER="invalid" trailing',
        "FJ_ORG='invalid'x",
      ].join("\n"),
    ),
  ).toEqual({
    FJ_HOST: "https://forgejo.example.test",
    FJ_SSH_BASE: "ssh://git@forgejo.example.test:2222",
  })
})

test("discovers the nearest dotenv file from the effective working directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "forgejo-cli-env-"))
  temporaryDirectories.push(root)
  const parent = join(root, "parent")
  const cwd = join(parent, "project")
  await mkdir(cwd, { recursive: true })
  await writeFile(join(root, ".env"), "FJ_HOST=root.example.test\n")
  await writeFile(join(parent, ".env"), "FJ_ORG=nearest-team\nUNRELATED_SECRET=must-not-leak\n")

  const resolved = await forgejoEnvironmentFileResolve({ cwd })

  expect(resolved).toEqual({ success: true, data: { FJ_ORG: "nearest-team" } })
})

test("returns no values when no dotenv file exists", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "forgejo-cli-env-empty-"))
  temporaryDirectories.push(cwd)

  expect(await forgejoEnvironmentFileResolve({ cwd })).toEqual({ success: true, data: {} })
})
