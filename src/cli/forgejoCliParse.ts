import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoCliCommandHierarchy } from "./forgejoCliCommandHierarchy.js"

const forgejoCliStyleSchema = a.picklist(["fancy", "minimal"])
type ForgejoCliStyle = a.InferOutput<typeof forgejoCliStyleSchema>

type ForgejoCliParseOptions = {
  stdoutIsTty?: boolean
}

type ForgejoCliOutputFields = {
  style: ForgejoCliStyle
  json?: true
}

type ForgejoCliInvocation =
  | { kind: "help"; path: string[]; cwd?: string }
  | { kind: "version"; verbose: boolean; cwd?: string; style: ForgejoCliStyle }
  | { kind: "whoami"; host?: string; cwd?: string; remote?: string; style: ForgejoCliStyle; json?: true }
  | { kind: "completion"; shell: string; binName: string; cwd?: string; style: ForgejoCliStyle }
  | {
      kind: "auth-add-token" | "auth-login"
      token?: string
      clientId?: string
      host?: string
      cwd?: string
      style: ForgejoCliStyle
    }
  | { kind: "auth-logout"; host?: string; cwd?: string; style: ForgejoCliStyle }
  | { kind: "auth-use-ssh"; host?: string; cwd?: string; useSsh: boolean; style: ForgejoCliStyle }
  | { kind: "auth-list"; cwd?: string; style: ForgejoCliStyle }
  | ({
      kind: "repo-create"
      name: string
      organization?: string
      description?: string
      private: boolean
      remote?: string
      push: boolean
      ssh?: boolean
    } & ForgejoCliBaseInvocation)
  | ({ kind: "repo-fork"; repository: string; name?: string; organization?: string } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "repo-migrate"
      cloneAddr: string
      repoName: string
      repoOwner?: string
      mirror: boolean
      private: boolean
      service?: string
      lfsEndpoint?: string
      mirrorInterval?: string
      authUsername?: string
      authPassword?: string
      authToken?: string
      include?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind:
        | "repo-view"
        | "repo-readme"
        | "repo-star"
        | "repo-unstar"
        | "repo-star-status"
        | "repo-watch"
        | "repo-unwatch"
        | "repo-watch-status"
        | "repo-browse"
      repository?: string
      list?: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "repo-clone"
      repository: string
      path?: string
      ssh?: boolean
      identityFile?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "repo-delete"; repository: string; yes: boolean } & ForgejoCliRepositoryInvocation)
  | ({ kind: "repo-label-view"; repository?: string; archived: boolean } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "repo-label-create"
      repository?: string
      name: string
      color: string
      description?: string
      exclusive: boolean
      archived: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "repo-label-delete"; repository?: string; label: string; yes: boolean } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "repo-label-edit"
      repository?: string
      label: string
      name?: string
      color?: string
      description?: string
      exclusive?: boolean
      archived?: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "repo-edit"; repository?: string; options: Record<string, unknown> } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "repo-units"
      repository?: string
      unit: string
      options: Record<string, unknown>
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "issue-create"
      repository?: string
      title: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      labels: string[]
      assignees: string[]
      template?: string
      noTemplate: boolean
      web: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "issue-edit"
      issue: string
      repository?: string
      title?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      state?: "open" | "closed"
      assignees?: string[]
      labelAdd: string[]
      labelRemove: string[]
      yes: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "issue-edit-title"
      issue: string
      repository?: string
      value?: string
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-edit-body"
      issue: string
      repository?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-edit-comment"
      issue: string
      repository?: string
      comment: number
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-edit-labels"
      issue: string
      repository?: string
      add: string[]
      remove: string[]
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-comment"
      issue: string
      repository?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-assign" | "issue-unassign"
      issue: string
      repository?: string
      users: string[]
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-close"
      issue: string
      repository?: string
      message?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      yes: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "issue-search"
      repository?: string
      query?: string
      labels?: string
      creator?: string
      assignee?: string
      state?: "open" | "closed" | "all"
      page: number
      limit: number
      all: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "issue-view"
      issue: string
      repository?: string
      view?: "body" | "comment" | "comments" | "assignees"
      comment?: number
    } & ForgejoCliIssueInvocation)
  | ({ kind: "issue-templates"; repository?: string } & ForgejoCliRepositoryInvocation)
  | ({ kind: "issue-browse"; issue: string; repository?: string } & ForgejoCliIssueInvocation)
  | ({
      kind:
        | "issue-dependency-add"
        | "issue-dependency-remove"
        | "issue-dependency-list"
        | "issue-block-add"
        | "issue-block-remove"
        | "issue-block-list"
      issue: string
      repository?: string
      targets: string[]
      yes: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-create"
      repository?: string
      title?: string
      base?: string
      head?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      autofill: boolean
      web: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "pr-search"
      repository?: string
      query?: string
      labels?: string
      creator?: string
      assignee?: string
      state?: "open" | "closed" | "all"
      page: number
      limit: number
      all: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "pr-view"
      pr: string
      repository?: string
      view?: "body" | "comment" | "comments" | "labels" | "assignees" | "diff" | "files" | "commits"
      comment?: number
      patch?: boolean
      editor?: boolean
      oneline?: boolean
    } & ForgejoCliIssueInvocation)
  | ({ kind: "pr-status"; pr: string; repository?: string; wait: boolean } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-checkout"
      pr: string
      repository?: string
      branch?: string
      ssh?: boolean
      identityFile?: string
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-comment"
      pr: string
      repository?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-assign" | "pr-unassign"
      pr: string
      repository?: string
      users: string[]
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-close"
      pr: string
      repository?: string
      message?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      yes: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-merge"
      pr: string
      repository?: string
      method?: "merge" | "rebase" | "rebase-merge" | "squash" | "manual"
      delete: boolean
      title?: string
      message?: string
      editor: boolean
      yes: boolean
    } & ForgejoCliIssueInvocation)
  | ({ kind: "pr-browse"; pr: string; repository?: string } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-review"
      pr: string
      repository?: string
      comments: boolean
      all: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind:
        | "pr-dependency-add"
        | "pr-dependency-remove"
        | "pr-dependency-list"
        | "pr-block-add"
        | "pr-block-remove"
        | "pr-block-list"
      pr: string
      repository?: string
      targets: string[]
      yes: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-edit-title"
      pr: string
      repository?: string
      value?: string
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-edit-body"
      pr: string
      repository?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-edit-comment"
      pr: string
      repository?: string
      comment: number
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-edit-labels"
      pr: string
      repository?: string
      add: string[]
      remove: string[]
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "pr-edit"
      pr: string
      repository?: string
      title?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      state?: "open" | "closed"
      assignees?: string[]
      labelAdd: string[]
      labelRemove: string[]
    } & ForgejoCliIssueInvocation)
  | ({
      kind: "user-search"
      query: string
      page: number
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "user-view" | "user-browse"; user?: string; remote?: string } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-follow" | "user-unfollow" | "user-block" | "user-unblock"
      user: string
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-following" | "user-followers" | "user-orgs" | "user-activity"
      user?: string
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-repos"
      user?: string
      starred: boolean
      sort?: "name" | "modified" | "created" | "stars" | "forks"
      page: number
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-edit"
      edit: {
        field: "bio" | "name" | "pronouns" | "location" | "activity" | "email" | "website"
        value?: string
        unset?: boolean
        visibility?: "hidden" | "public"
        add?: string[]
        remove?: string[]
      }
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-key-list" | "user-key-view" | "user-key-delete" | "user-key-upload"
      id?: number
      verbose?: boolean
      keyFile?: string
      title?: string
      force?: boolean
      readOnly?: boolean
      yes?: boolean
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "user-gpg-list" | "user-gpg-view" | "user-gpg-delete" | "user-gpg-upload" | "user-gpg-verify"
      id?: number
      verbose?: boolean
      key?: string
      noVerify?: boolean
      force?: boolean
      yes?: boolean
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "org-list"; page: number; onlyMemberOf: boolean; remote?: string } & ForgejoCliBaseInvocation)
  | ({ kind: "org-view" | "org-activity"; organization: string; remote?: string } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-create" | "org-edit"
      organization: string
      options: Record<string, unknown>
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "org-members"; organization: string; page: number; remote?: string } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-visibility"
      organization: string
      visibility?: "public" | "private"
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-team-list" | "org-team-view" | "org-team-delete"
      organization: string
      team?: string
      listPermissions?: boolean
      yes?: boolean
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-team-create" | "org-team-edit"
      organization: string
      team: string
      options: Record<string, unknown>
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind:
        | "org-team-repo-list"
        | "org-team-repo-add"
        | "org-team-repo-rm"
        | "org-team-member-list"
        | "org-team-member-add"
        | "org-team-member-rm"
      organization: string
      team: string
      repository?: string
      user?: string
      page?: number
      yes?: boolean
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-label-list" | "org-label-add" | "org-label-edit" | "org-label-rm"
      organization: string
      label?: string
      options?: Record<string, unknown>
      yes?: boolean
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "org-repo-list"; organization: string; page: number; remote?: string } & ForgejoCliBaseInvocation)
  | ({
      kind: "org-repo-create"
      organization: string
      name: string
      options: Record<string, unknown>
      remote?: string
    } & ForgejoCliBaseInvocation)
  | ({ kind: "wiki-contents"; repository?: string } & ForgejoCliRepositoryInvocation)
  | ({ kind: "wiki-view"; repository?: string; page: string } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "wiki-clone"
      repository?: string
      path?: string
      ssh?: boolean
      identityFile?: string
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "wiki-browse"; repository?: string; page: string } & ForgejoCliRepositoryInvocation)
  | ({ kind: "actions-tasks"; repository?: string; page: number } & ForgejoCliRepositoryInvocation)
  | ({ kind: "actions-variables-list"; repository?: string; verbose: boolean } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "actions-variables-create"
      repository?: string
      name: string
      data?: string
      force: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "actions-variables-delete"
      repository?: string
      name: string
      yes: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "actions-secrets-list"; repository?: string } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "actions-secrets-create"
      repository?: string
      name: string
      data: string
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "actions-secrets-delete"
      repository?: string
      name: string
      yes: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "actions-dispatch"
      repository?: string
      name: string
      ref: string
      inputs: Record<string, string>
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-create"
      repository?: string
      name: string
      tag?: string
      createTag: boolean
      createTagName?: string
      attach: string[]
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      branch?: string
      draft: boolean
      prerelease: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-edit"
      repository?: string
      name: string
      rename?: string
      tag?: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      draft?: boolean
      prerelease?: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-delete" | "release-view"
      repository?: string
      name: string
      byTag: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-list"
      repository?: string
      includePrerelease: boolean
      includeDraft: boolean
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "release-browse"; repository?: string; name?: string } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-asset-create"
      repository?: string
      release: string
      file: string
      assetName?: string
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-asset-delete"
      repository?: string
      release: string
      asset: string
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "release-asset-download"
      repository?: string
      release: string
      asset: string
      output?: string
    } & ForgejoCliRepositoryInvocation)
  | ({
      kind: "tag-create"
      repository?: string
      name: string
      body?: string
      bodyFile?: string
      stdin: boolean
      editor: boolean
      branch?: string
    } & ForgejoCliRepositoryInvocation)
  | ({ kind: "tag-delete" | "tag-view"; repository?: string; name: string } & ForgejoCliRepositoryInvocation)
  | ({ kind: "tag-list"; repository?: string; page: number } & ForgejoCliRepositoryInvocation)

type ForgejoCliBaseInvocation = {
  host?: string
  cwd?: string
  style: ForgejoCliStyle
  json?: true
}

type ForgejoCliRepositoryInvocation = ForgejoCliBaseInvocation & { remote?: string }
type ForgejoCliIssueInvocation = ForgejoCliRepositoryInvocation

type ForgejoCliOptionDefinition = {
  name: string
  short?: string
  takesValue?: boolean
  optionalValue?: boolean
  repeat?: boolean
  booleanValue?: boolean
  negativeFor?: string
}

type ForgejoCliParsedOptions = {
  values: Record<string, string | string[] | boolean>
  positional: string[]
  help: boolean
}

function forgejoCliStyleResolve(input: string | undefined, stdoutIsTty: boolean): ForgejoCliStyle {
  if (input === "minimal") return "minimal"
  if (!stdoutIsTty) return "minimal"
  return "fancy"
}

function forgejoCliOptionValue(args: readonly string[], index: number, option: string) {
  const argument = args[index]
  if (argument === undefined) return { error: `Missing value for ${option}`, nextIndex: index }
  const equalsIndex = argument.indexOf("=")
  if (equalsIndex !== -1) return { value: argument.slice(equalsIndex + 1), nextIndex: index }
  const value = args[index + 1]
  if (value === undefined || (value.startsWith("-") && value !== "-"))
    return { error: `Missing value for ${option}`, nextIndex: index }
  return { value, nextIndex: index + 1 }
}

function forgejoCliGlobalParse(argv: readonly string[]): ForgejoResult<{
  args: string[]
  cwd?: string
  host?: string
  style?: string
  json: boolean
  help: boolean
}> {
  const op = "forgejoCliParse"
  const args: string[] = []
  let cwd: string | undefined
  let host: string | undefined
  let style: string | undefined
  let json = false
  let help = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) continue
    if (argument === "--") {
      args.push(...argv.slice(index + 1))
      break
    }
    if (argument === "--help" || argument === "-h") {
      help = true
      continue
    }
    if (argument === "--json") {
      json = true
      continue
    }
    const shortOption = argument.slice(0, 2)
    const isHost = argument === "--host" || argument.startsWith("--host=") || shortOption === "-H"
    const isCwd = argument === "--cwd" || argument.startsWith("--cwd=") || shortOption === "-C"
    const isStyle = argument === "--style" || argument.startsWith("--style=")
    if (!isHost && !isCwd && !isStyle) {
      args.push(argument)
      continue
    }
    const name = isHost ? "--host" : isCwd ? "--cwd" : "--style"
    if (
      (name === "--host" && shortOption === "-H" && argument.length > 2) ||
      (name === "--cwd" && shortOption === "-C" && argument.length > 2)
    ) {
      const value = argument.slice(2)
      if (name === "--host") host = value
      else cwd = value
      continue
    }
    const value = forgejoCliOptionValue(argv, index, name)
    if (value.error || value.value === undefined)
      return createResultError(op, value.error ?? `Missing value for ${name}`)
    if (name === "--host") host = value.value
    else if (name === "--cwd") cwd = value.value
    else style = value.value
    index = value.nextIndex
  }

  if (style !== undefined && !a.safeParse(forgejoCliStyleSchema, style).success)
    return createResultError(op, `Invalid value for --style: ${style}. Expected fancy or minimal`)
  return createResult({ args, cwd, host, style, json, help })
}

function forgejoCliHelpPath(args: readonly string[]): string[] {
  const path: string[] = []
  let command = forgejoCliCommandHierarchy
  for (const argument of args) {
    if (argument.startsWith("-")) continue
    const child = command.commands?.[argument]
    if (!child) break
    path.push(argument)
    command = child
  }
  return path
}

function forgejoCliArgumentError(message: string): ForgejoResult<never> {
  return createResultError("forgejoCliParse", `${message}. Use 'fj --help' for usage.`)
}

function forgejoCliOptionDefinitionFind(definitions: readonly ForgejoCliOptionDefinition[], argument: string) {
  const longName = argument.startsWith("--") ? argument.slice(2).split("=", 1)[0] : undefined
  if (longName) return definitions.find((definition) => definition.name === longName)
  const shortName = argument.slice(1, 2)
  return definitions.find((definition) => definition.short === shortName)
}

function forgejoCliOptionsParse(
  args: readonly string[],
  definitions: readonly ForgejoCliOptionDefinition[],
): ForgejoResult<ForgejoCliParsedOptions> {
  const values: Record<string, string | string[] | boolean> = {}
  const positional: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === undefined) continue
    if (argument === "--help" || argument === "-h") return createResult({ values, positional, help: true })
    if (argument === "--") {
      positional.push(...args.slice(index + 1))
      break
    }
    if (argument === "-" || !argument.startsWith("-")) {
      positional.push(argument)
      continue
    }
    const definition = forgejoCliOptionDefinitionFind(definitions, argument)
    if (!definition) return forgejoCliArgumentError(`Unknown option '${argument}'`)
    const equalsIndex = argument.indexOf("=")
    const hasInlineValue = equalsIndex !== -1
    const inlineValue = hasInlineValue ? argument.slice(equalsIndex + 1) : undefined
    if (definition.optionalValue) {
      const optionValue = hasInlineValue
        ? { value: inlineValue, nextIndex: index }
        : args[index + 1] !== undefined && (args[index + 1] === "-" || !args[index + 1]?.startsWith("-"))
          ? { value: args[index + 1], nextIndex: index + 1 }
          : { value: true as const, nextIndex: index }
      if (values[definition.name] !== undefined)
        return forgejoCliArgumentError(`Option '--${definition.name}' was provided more than once`)
      values[definition.name] = optionValue.value as string | boolean
      index = optionValue.nextIndex
      continue
    }
    if (!definition.takesValue) {
      let value: boolean = true
      if (hasInlineValue) {
        if (inlineValue !== "true" && inlineValue !== "false")
          return forgejoCliArgumentError(`Option '${argument}' expects true or false`)
        value = inlineValue === "true"
      } else if (
        definition.booleanValue &&
        args[index + 1] &&
        (args[index + 1] === "true" || args[index + 1] === "false")
      ) {
        value = args[index + 1] === "true"
        index += 1
      }
      const key = definition.negativeFor ?? definition.name
      values[key] = definition.negativeFor ? !value : value
      continue
    }
    const optionValue = hasInlineValue
      ? { value: inlineValue, nextIndex: index }
      : forgejoCliOptionValue(args, index, `--${definition.name}`)
    if ("error" in optionValue && optionValue.error) return forgejoCliArgumentError(optionValue.error)
    if (optionValue.value === undefined) return forgejoCliArgumentError(`Missing value for --${definition.name}`)
    if (definition.repeat) {
      const current = values[definition.name]
      values[definition.name] = [...(Array.isArray(current) ? current : []), optionValue.value]
    } else {
      if (values[definition.name] !== undefined)
        return forgejoCliArgumentError(`Option '--${definition.name}' was provided more than once`)
      values[definition.name] = optionValue.value
    }
    index = optionValue.nextIndex
  }
  return createResult({ values, positional, help: false })
}

function forgejoCliString(values: ForgejoCliParsedOptions["values"], name: string): string | undefined {
  const value = values[name]
  return typeof value === "string" ? value : undefined
}

function forgejoCliBoolean(values: ForgejoCliParsedOptions["values"], name: string): boolean {
  return values[name] === true
}

function forgejoCliStrings(values: ForgejoCliParsedOptions["values"], name: string): string[] {
  const value = values[name]
  if (Array.isArray(value)) return value
  return typeof value === "string" ? [value] : []
}

function forgejoCliOutputFields(json: boolean, style: ForgejoCliStyle): ForgejoCliOutputFields {
  return json ? { style, json: true } : { style }
}

function forgejoCliDefinitions(
  names: readonly string[],
  repeatNames: readonly string[] = [],
  booleanValueNames: readonly string[] = [],
): ForgejoCliOptionDefinition[] {
  return names.map((name) => ({
    name,
    takesValue: !booleanValueNames.includes(name),
    repeat: repeatNames.includes(name),
    booleanValue: booleanValueNames.includes(name),
  }))
}

function forgejoCliRepositoryDefinitions(
  extra: readonly ForgejoCliOptionDefinition[] = [],
): ForgejoCliOptionDefinition[] {
  return [{ name: "repo", short: "r", takesValue: true }, { name: "remote", short: "R", takesValue: true }, ...extra]
}

function forgejoCliIssueDefinitions(extra: readonly ForgejoCliOptionDefinition[] = []): ForgejoCliOptionDefinition[] {
  return forgejoCliRepositoryDefinitions(extra)
}

function forgejoCliRepositoryTarget(
  parsed: ForgejoCliParsedOptions,
  positional: readonly string[],
  required: boolean,
): ForgejoResult<{ repository?: string; rest: string[] }> {
  const optionRepository = forgejoCliString(parsed.values, "repo")
  const first = positional[0]
  if (optionRepository !== undefined && first !== undefined)
    return forgejoCliArgumentError("Repository was provided more than once")
  const repository = optionRepository ?? first
  const rest = optionRepository === undefined ? positional.slice(1) : [...positional]
  if (required && repository === undefined) return forgejoCliArgumentError("A repository is required")
  return createResult({ ...(repository === undefined ? {} : { repository }), rest })
}

function forgejoCliRemote(values: ForgejoCliParsedOptions["values"]): string | undefined {
  return forgejoCliString(values, "remote")
}

function forgejoCliIssueReference(
  positional: readonly string[],
  repository: string | undefined,
  required = true,
): ForgejoResult<{ issue?: string; rest: string[] }> {
  const first = positional[0]
  if (first === undefined) {
    if (required) return forgejoCliArgumentError("An issue reference is required")
    return createResult({ rest: [] })
  }
  if (repository !== undefined && first.includes("#"))
    return forgejoCliArgumentError("Use either an issue repository reference or --repo")
  const issue = repository === undefined || first.includes("#") ? first : `${repository}#${first}`
  return createResult({ issue, rest: positional.slice(1) })
}

function forgejoCliNumber(value: string | undefined, name: string): ForgejoResult<number | undefined> {
  if (value === undefined) return createResult(undefined)
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1) return forgejoCliArgumentError(`${name} must be a positive integer`)
  return createResult(number)
}

function forgejoCliIndex(value: string | undefined, name: string): ForgejoResult<number | undefined> {
  if (value === undefined) return createResult(undefined)
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0)
    return forgejoCliArgumentError(`${name} must be a non-negative integer`)
  return createResult(number)
}

function forgejoCliNestedSplit(
  args: readonly string[],
  children: readonly string[],
  valueOptions: readonly string[],
): { before: string[]; child?: string; after: string[] } {
  const before: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (!argument) continue
    if (!argument.startsWith("-") && children.includes(argument))
      return { before, child: argument, after: [...args.slice(index + 1)] }
    before.push(argument)
    const name = (argument.startsWith("--") ? argument.slice(2).split("=", 1)[0] : argument.slice(1, 2)) ?? ""
    if (valueOptions.includes(name) && !argument.includes("=")) {
      const value = args[index + 1]
      if (value !== undefined) before.push(value)
      index += 1
    }
  }
  return { before, after: [] }
}

function forgejoCliTokenOptionsParse(
  args: readonly string[],
  requireToken: boolean,
): ForgejoResult<{ token?: string; help: boolean }> {
  const parsed = forgejoCliOptionsParse(args, [{ name: "token", takesValue: true }])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ token: forgejoCliString(parsed.data.values, "token"), help: true })
  const positional = parsed.data.positional
  const optionToken = forgejoCliString(parsed.data.values, "token")
  if (optionToken !== undefined && positional.length > 0)
    return forgejoCliArgumentError("Only one token may be provided")
  if (positional.length > 1) return forgejoCliArgumentError("Only one token may be provided")
  const token = optionToken ?? positional[0]
  if (requireToken && token === undefined)
    return forgejoCliArgumentError("An application token is required for non-interactive auth")
  return createResult({ token, help: false })
}

export function forgejoCliParse(
  argv: readonly string[],
  options: ForgejoCliParseOptions = {},
): ForgejoResult<ForgejoCliInvocation> {
  const globals = forgejoCliGlobalParse(argv)
  if (!globals.success) return globals
  const style = forgejoCliStyleResolve(globals.data.style, options.stdoutIsTty ?? Boolean(process.stdout.isTTY))
  if (globals.data.help) return createResult({ kind: "help", path: forgejoCliHelpPath(globals.data.args) })
  if (globals.data.args.length === 0) return createResult({ kind: "help", path: [] })
  const [command, ...args] = globals.data.args
  if (!command || !forgejoCliCommandHierarchy.commands?.[command])
    return forgejoCliArgumentError(`Unknown command '${command}'`)

  if (command === "version") {
    const parsed = forgejoCliOptionsParse(args, [{ name: "verbose", short: "v", takesValue: false }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: [command] })
    if (parsed.data.positional.length > 0)
      return forgejoCliArgumentError("version does not accept positional arguments")
    return createResult({
      kind: "version",
      verbose: forgejoCliBoolean(parsed.data.values, "verbose"),
      cwd: globals.data.cwd,
      style,
    })
  }

  if (command === "whoami") {
    const parsed = forgejoCliOptionsParse(args, [{ name: "remote", short: "r", takesValue: true }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: [command] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("whoami does not accept positional arguments")
    return createResult({
      kind: "whoami",
      host: globals.data.host,
      cwd: globals.data.cwd,
      remote: forgejoCliRemote(parsed.data.values),
      ...forgejoCliOutputFields(globals.data.json, style),
    })
  }

  if (command === "completion") {
    const parsed = forgejoCliOptionsParse(args, [{ name: "bin-name", takesValue: true }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: [command] })
    const shell = parsed.data.positional[0]
    if (!shell) return forgejoCliArgumentError("completion requires a shell")
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError("completion accepts only one shell")
    if (!["bash", "zsh", "fish", "powershell"].includes(shell.toLowerCase()))
      return forgejoCliArgumentError(`Unsupported completion shell '${shell}'`)
    const binName = forgejoCliString(parsed.data.values, "bin-name") ?? "fj"
    if (binName.trim().length === 0) return forgejoCliArgumentError("--bin-name must not be empty")
    return createResult({ kind: "completion", shell: shell.toLowerCase(), binName, cwd: globals.data.cwd, style })
  }

  if (command === "auth") return forgejoCliAuthParse(args, globals.data.host, globals.data.cwd, style)
  if (command === "repo") return forgejoCliRepoParse(args, globals.data, style)
  if (command === "issue") return forgejoCliIssueParse(args, globals.data, style)
  if (command === "pr") return forgejoCliPullRequestParse(args, globals.data, style)
  if (command === "user") return forgejoCliUserParse(args, globals.data, style)
  if (command === "org") return forgejoCliOrganizationParse(args, globals.data, style)
  if (command === "release") return forgejoCliReleaseParse(args, globals.data, style)
  if (command === "tag") return forgejoCliTagParse(args, globals.data, style)
  if (command === "wiki") return forgejoCliWikiParse(args, globals.data, style)
  if (command === "actions") return forgejoCliActionsParse(args, globals.data, style)
  return forgejoCliArgumentError(`Command '${command}' is not implemented in this CLI slice`)
}

function forgejoCliAuthParse(
  args: readonly string[],
  host: string | undefined,
  cwd: string | undefined,
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [subcommand, ...subcommandArgs] = args
  if (!subcommand) return createResult({ kind: "help", path: ["auth"] })
  if (subcommand === "add-key") return forgejoCliAuthTokenParse("add-token", subcommandArgs, host, cwd, style)
  if (subcommand === "add-token") return forgejoCliAuthTokenParse(subcommand, subcommandArgs, host, cwd, style)
  if (subcommand === "login") return forgejoCliAuthLoginParse(subcommandArgs, host, cwd, style)
  if (subcommand === "logout") return forgejoCliAuthLogoutParse(subcommandArgs, host, cwd, style)
  if (subcommand === "use-ssh") return forgejoCliAuthSshParse(subcommandArgs, host, cwd, style)
  if (subcommand === "list") {
    if (subcommandArgs.includes("--help") || subcommandArgs.includes("-h"))
      return createResult({ kind: "help", path: ["auth", "list"] })
    if (subcommandArgs.length > 0) return forgejoCliArgumentError("auth list does not accept arguments")
    return createResult({ kind: "auth-list", cwd, style })
  }
  if (subcommand === "--help" || subcommand === "-h") return createResult({ kind: "help", path: ["auth"] })
  return forgejoCliArgumentError(`Unknown auth command '${subcommand}'`)
}

function forgejoCliAuthTokenParse(
  kind: "add-token" | "login",
  args: readonly string[],
  host: string | undefined,
  cwd: string | undefined,
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliTokenOptionsParse(args, kind === "add-token")
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["auth", kind] })
  return createResult({ kind: `auth-${kind}`, token: parsed.data.token, host, cwd, style })
}

function forgejoCliAuthLoginParse(
  args: readonly string[],
  host: string | undefined,
  cwd: string | undefined,
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, [
    { name: "token", takesValue: true },
    { name: "client-id", takesValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["auth", "login"] })
  if (parsed.data.positional.length > 1) return forgejoCliArgumentError("Only one token may be provided")
  const optionToken = forgejoCliString(parsed.data.values, "token")
  if (optionToken !== undefined && parsed.data.positional.length > 0)
    return forgejoCliArgumentError("Only one token may be provided")
  const token = optionToken ?? parsed.data.positional[0]
  const clientId = forgejoCliString(parsed.data.values, "client-id")
  return createResult({
    kind: "auth-login",
    ...(token === undefined ? {} : { token }),
    ...(clientId === undefined ? {} : { clientId }),
    host,
    cwd,
    style,
  })
}

function forgejoCliAuthLogoutParse(
  args: readonly string[],
  host: string | undefined,
  cwd: string | undefined,
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  if (args.includes("--help") || args.includes("-h")) return createResult({ kind: "help", path: ["auth", "logout"] })
  if (args.some((argument) => argument.startsWith("-")))
    return forgejoCliArgumentError("auth logout received an unknown option")
  if (args.length > 1) return forgejoCliArgumentError("auth logout accepts at most one host")
  if (host !== undefined && args.length > 0)
    return forgejoCliArgumentError("Specify the host with --host or as an argument, not both")
  return createResult({ kind: "auth-logout", host: host ?? args[0], cwd, style })
}

function forgejoCliAuthSshParse(
  args: readonly string[],
  host: string | undefined,
  cwd: string | undefined,
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  if (args.includes("--help") || args.includes("-h")) return createResult({ kind: "help", path: ["auth", "use-ssh"] })
  if (args.some((argument) => argument.startsWith("-")))
    return forgejoCliArgumentError("auth use-ssh received an unknown option")
  if (args.length > 1) return forgejoCliArgumentError("auth use-ssh accepts at most one boolean")
  const value = args[0] ?? "true"
  if (value !== "true" && value !== "false") return forgejoCliArgumentError("auth use-ssh expects true or false")
  return createResult({ kind: "auth-use-ssh", host, cwd, useSsh: value === "true", style })
}

function forgejoCliRepoParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [rawSubcommand, ...subcommandArgs] = args
  if (!rawSubcommand) return createResult({ kind: "help", path: ["repo"] })
  const subcommand = rawSubcommand === "label" ? "labels" : rawSubcommand === "unit" ? "units" : rawSubcommand
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (subcommand === "create") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      { name: "name", takesValue: true },
      { name: "organization", short: "o", takesValue: true },
      { name: "description", short: "d", takesValue: true },
      { name: "private", short: "P", takesValue: false },
      { name: "remote", short: "R", takesValue: true },
      { name: "push", takesValue: false },
      { name: "ssh", short: "S", takesValue: false, booleanValue: true },
      { name: "no-ssh", takesValue: false, negativeFor: "ssh" },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "create"] })
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError("repo create accepts one repository name")
    const name = forgejoCliString(parsed.data.values, "name") ?? parsed.data.positional[0]
    if (!name) return forgejoCliArgumentError("repo create requires a repository name")
    return createResult({
      kind: "repo-create",
      name,
      organization: forgejoCliString(parsed.data.values, "organization"),
      description: forgejoCliString(parsed.data.values, "description"),
      private: forgejoCliBoolean(parsed.data.values, "private"),
      remote: forgejoCliRemote(parsed.data.values),
      push: forgejoCliBoolean(parsed.data.values, "push"),
      ...(typeof parsed.data.values.ssh === "boolean" ? { ssh: parsed.data.values.ssh } : {}),
      ...base,
    })
  }
  if (subcommand === "migrate") return forgejoCliRepoMigrateParse(subcommandArgs, base)
  if (subcommand === "fork") return forgejoCliRepoForkParse(subcommandArgs, base)
  if (
    ["view", "readme", "star", "unstar", "star-status", "watch", "unwatch", "watch-status", "browse"].includes(
      subcommand,
    )
  )
    return forgejoCliRepoSimpleParse(subcommand, subcommandArgs, base)
  if (subcommand === "clone") return forgejoCliRepoCloneParse(subcommandArgs, base)
  if (subcommand === "delete") return forgejoCliRepoDeleteParse(subcommandArgs, base)
  if (subcommand === "labels") return forgejoCliRepoLabelsParse(subcommandArgs, base)
  if (subcommand === "edit") return forgejoCliRepoEditParse(subcommandArgs, base)
  if (subcommand === "units") return forgejoCliRepoUnitsParse(subcommandArgs, base)
  if (subcommand === "--help" || subcommand === "-h") return createResult({ kind: "help", path: ["repo"] })
  return forgejoCliArgumentError(`Unknown repo command '${rawSubcommand}'`)
}

function forgejoCliRepoSimpleParse(
  subcommand: string,
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliRepositoryDefinitions(
      subcommand === "star-status" || subcommand === "watch-status" ? [{ name: "list", takesValue: false }] : [],
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", subcommand] })
  const target = forgejoCliRepositoryTarget(parsed.data, parsed.data.positional, false)
  if (!target.success) return target
  if (target.data.rest.length > 0) return forgejoCliArgumentError(`repo ${subcommand} accepts at most one repository`)
  const list = forgejoCliBoolean(parsed.data.values, "list")
  if (list && target.data.repository !== undefined)
    return forgejoCliArgumentError(`repo ${subcommand} --list cannot be used with a repository`)
  if (list && subcommand !== "star-status" && subcommand !== "watch-status")
    return forgejoCliArgumentError(`repo ${subcommand} does not support --list`)
  return createResult({
    kind: `repo-${subcommand}`,
    repository: target.data.repository,
    ...(list ? { list: true } : {}),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliRepoForkParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliRepositoryDefinitions([
      { name: "name", takesValue: true },
      { name: "organization", short: "o", takesValue: true },
    ]),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "fork"] })
  const target = forgejoCliRepositoryTarget(parsed.data, parsed.data.positional, true)
  if (!target.success) return target
  if (target.data.rest.length > 0) return forgejoCliArgumentError("repo fork accepts one repository")
  return createResult({
    kind: "repo-fork",
    repository: target.data.repository ?? "",
    name: forgejoCliString(parsed.data.values, "name"),
    organization: forgejoCliString(parsed.data.values, "organization"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliRepoMigrateParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, [
    { name: "name", short: "n", takesValue: true },
    { name: "mirror", short: "m", takesValue: false },
    { name: "private", short: "P", takesValue: false },
    { name: "service", short: "s", takesValue: true },
    { name: "lfs-endpoint", short: "L", takesValue: true },
    { name: "mirror-interval", short: "i", takesValue: true },
    { name: "auth-username", short: "l", takesValue: true },
    { name: "auth-password", short: "p", takesValue: true },
    { name: "auth-token", short: "t", takesValue: true },
    { name: "include", short: "I", takesValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "migrate"] })
  if (parsed.data.positional.length < 1 || parsed.data.positional.length > 2)
    return forgejoCliArgumentError("repo migrate requires SOURCE and [OWNER/]NAME")
  const destination = forgejoCliString(parsed.data.values, "name") ?? parsed.data.positional[1]
  if (!destination) return forgejoCliArgumentError("repo migrate requires OWNER/NAME")
  if (forgejoCliString(parsed.data.values, "name") !== undefined && parsed.data.positional.length > 1)
    return forgejoCliArgumentError("Destination was provided more than once")
  const destinationParts = destination.split("/")
  if (destinationParts.length !== 1 && destinationParts.length !== 2)
    return forgejoCliArgumentError("repo migrate destination must be [OWNER/]NAME")
  const include = forgejoCliString(parsed.data.values, "include")
  return createResult({
    kind: "repo-migrate",
    cloneAddr: parsed.data.positional[0] ?? "",
    ...(destinationParts.length === 2 ? { repoOwner: destinationParts[0] } : {}),
    repoName: destinationParts.length === 2 ? (destinationParts[1] ?? "") : (destinationParts[0] ?? ""),
    mirror: forgejoCliBoolean(parsed.data.values, "mirror"),
    private: forgejoCliBoolean(parsed.data.values, "private"),
    service: forgejoCliString(parsed.data.values, "service"),
    lfsEndpoint: forgejoCliString(parsed.data.values, "lfs-endpoint"),
    mirrorInterval: forgejoCliString(parsed.data.values, "mirror-interval"),
    authUsername: forgejoCliString(parsed.data.values, "auth-username"),
    authPassword: forgejoCliString(parsed.data.values, "auth-password"),
    authToken: forgejoCliString(parsed.data.values, "auth-token"),
    include,
    ...base,
  })
}

function forgejoCliRepoCloneParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, [
    { name: "repo", short: "r", takesValue: true },
    { name: "ssh", short: "S", takesValue: false },
    { name: "no-ssh", takesValue: false, negativeFor: "ssh" },
    { name: "identity-file", short: "I", takesValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "clone"] })
  const target = forgejoCliRepositoryTarget(parsed.data, parsed.data.positional, true)
  if (!target.success) return target
  if (target.data.rest.length > 1) return forgejoCliArgumentError("repo clone accepts at most one destination path")
  return createResult({
    kind: "repo-clone",
    repository: target.data.repository ?? "",
    path: target.data.rest[0],
    ...(typeof parsed.data.values.ssh === "boolean" ? { ssh: parsed.data.values.ssh } : {}),
    identityFile: forgejoCliString(parsed.data.values, "identity-file"),
    ...base,
  })
}

function forgejoCliRepoDeleteParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, [
    { name: "repo", short: "r", takesValue: true },
    { name: "remote", short: "R", takesValue: true },
    { name: "yes", short: "y", takesValue: false },
    { name: "force", takesValue: false },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "delete"] })
  const target = forgejoCliRepositoryTarget(parsed.data, parsed.data.positional, true)
  if (!target.success) return target
  if (target.data.rest.length > 0) return forgejoCliArgumentError("repo delete accepts one repository")
  return createResult({
    kind: "repo-delete",
    repository: target.data.repository ?? "",
    yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliRepoLabelsParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["view", "create", "delete", "edit"], ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["repo", "labels"] })
  const parent = forgejoCliOptionsParse(split.before, forgejoCliRepositoryDefinitions())
  if (!parent.success) return parent
  const childArgs = split.after
  if (split.child === "view") {
    const parsed = forgejoCliOptionsParse(
      childArgs,
      forgejoCliRepositoryDefinitions([{ name: "archived", takesValue: false }]),
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "labels", "view"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("labels view accepts no positional arguments")
    const target = forgejoCliNestedRepositoryTarget(parent.data, parsed.data)
    if (!target.success) return target
    return createResult({
      kind: "repo-label-view",
      archived: forgejoCliBoolean(parsed.data.values, "archived"),
      ...target.data,
      ...base,
    })
  }
  if (split.child === "create") {
    const parsed = forgejoCliOptionsParse(
      childArgs,
      forgejoCliRepositoryDefinitions([
        { name: "description", short: "d", takesValue: true },
        { name: "exclusive", short: "e", takesValue: false },
        { name: "archived", short: "a", takesValue: false },
      ]),
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "labels", "create"] })
    if (parsed.data.positional.length !== 2) return forgejoCliArgumentError("labels create requires NAME and COLOR")
    const target = forgejoCliNestedRepositoryTarget(parent.data, parsed.data)
    if (!target.success) return target
    return createResult({
      kind: "repo-label-create",
      name: parsed.data.positional[0] ?? "",
      color: parsed.data.positional[1] ?? "",
      description: forgejoCliString(parsed.data.values, "description"),
      exclusive: forgejoCliBoolean(parsed.data.values, "exclusive"),
      archived: forgejoCliBoolean(parsed.data.values, "archived"),
      ...target.data,
      ...base,
    })
  }
  if (split.child === "delete") {
    const parsed = forgejoCliOptionsParse(
      childArgs,
      forgejoCliRepositoryDefinitions([
        { name: "yes", short: "y", takesValue: false },
        { name: "force", takesValue: false },
      ]),
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "labels", "delete"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("labels delete requires a label")
    const target = forgejoCliNestedRepositoryTarget(parent.data, parsed.data)
    if (!target.success) return target
    return createResult({
      kind: "repo-label-delete",
      label: parsed.data.positional[0] ?? "",
      yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
      ...target.data,
      ...base,
    })
  }
  const parsed = forgejoCliOptionsParse(
    childArgs,
    forgejoCliRepositoryDefinitions([
      { name: "name", takesValue: true },
      { name: "color", takesValue: true },
      { name: "description", short: "d", takesValue: true },
      { name: "exclusive", takesValue: true, booleanValue: true },
      { name: "archived", takesValue: true, booleanValue: true },
    ]),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "labels", "edit"] })
  if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("labels edit requires a label")
  const target = forgejoCliNestedRepositoryTarget(parent.data, parsed.data)
  if (!target.success) return target
  return createResult({
    kind: "repo-label-edit",
    label: parsed.data.positional[0] ?? "",
    name: forgejoCliString(parsed.data.values, "name"),
    color: forgejoCliString(parsed.data.values, "color"),
    description: forgejoCliString(parsed.data.values, "description"),
    ...(typeof parsed.data.values.exclusive === "boolean" ? { exclusive: parsed.data.values.exclusive } : {}),
    ...(typeof parsed.data.values.archived === "boolean" ? { archived: parsed.data.values.archived } : {}),
    ...target.data,
    ...base,
  })
}

function forgejoCliRepoEditParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const names = [
    "repo",
    "remote",
    "archived",
    "default-branch",
    "description",
    "enable-prune",
    "mirror-interval",
    "name",
    "private",
    "template",
    "website",
  ]
  const parsed = forgejoCliOptionsParse(args, [
    { name: "repo", short: "r", takesValue: true },
    { name: "remote", short: "R", takesValue: true },
    ...forgejoCliDefinitions(names.slice(2), [], ["archived", "enable-prune", "private", "template"]),
    { name: "unset-avatar", short: "u", takesValue: false },
    { name: "avatar", short: "A", takesValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "edit"] })
  const target = forgejoCliRepositoryTarget(parsed.data, parsed.data.positional, false)
  if (!target.success) return target
  const avatar = forgejoCliString(parsed.data.values, "avatar")
  const unsetAvatar = forgejoCliBoolean(parsed.data.values, "unset-avatar")
  if (avatar !== undefined && unsetAvatar)
    return forgejoCliArgumentError("repo edit --avatar cannot be used with --unset-avatar")
  const options: Record<string, unknown> = {}
  const map: Record<string, string> = {
    "default-branch": "defaultBranch",
    "enable-prune": "enablePrune",
    "mirror-interval": "mirrorInterval",
    "unset-avatar": "unsetAvatar",
  }
  for (const [key, value] of Object.entries(parsed.data.values))
    if (key !== "repo" && key !== "remote") options[map[key] ?? key] = value
  delete options.avatar
  delete options.unsetAvatar
  if (avatar !== undefined) options.avatar = avatar
  if (unsetAvatar) options.unsetAvatar = true
  return createResult({
    kind: "repo-edit",
    repository: target.data.repository,
    options,
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliRepoUnitsParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const children = [
    "issues",
    "issue",
    "prs",
    "pr",
    "actions",
    "wiki",
    "packages",
    "package",
    "projects",
    "project",
    "releases",
    "release",
  ]
  const split = forgejoCliNestedSplit(args, children, ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["repo", "units"] })
  const parent = forgejoCliOptionsParse(split.before, forgejoCliRepositoryDefinitions())
  if (!parent.success) return parent
  const unitAliases: Record<string, string> = {
    issue: "issues",
    pr: "prs",
    package: "packages",
    project: "projects",
    release: "releases",
  }
  const unit = unitAliases[split.child] ?? split.child
  const optionNames =
    unit === "wiki"
      ? ["enable", "branch", "external-url", "globally-editable"]
      : unit === "prs"
        ? [
            "enable",
            "allow-fast-forward-only-merge",
            "allow-manual-merge",
            "allow-merge-commits",
            "allow-rebase",
            "allow-rebase-explicit",
            "allow-rebase-update",
            "allow-squash-merge",
            "autodetect-manual-merge",
            "default-allow-maintainer-edit",
            "default-delete-branch-after-merge",
            "default-merge-style",
            "default-update-style",
            "ignore-whitespace-conflicts",
          ]
        : ["enable"]
  const parsed = forgejoCliOptionsParse(
    split.after,
    forgejoCliRepositoryDefinitions(
      forgejoCliDefinitions(
        optionNames,
        [],
        optionNames.filter(
          (name) =>
            name !== "branch" &&
            name !== "external-url" &&
            name !== "default-merge-style" &&
            name !== "default-update-style",
        ),
      ),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["repo", "units", split.child] })
  const options: Record<string, unknown> = {}
  const map: Record<string, string> = {
    "external-url": "externalWikiUrl",
    "globally-editable": "globallyEditableWiki",
    "allow-fast-forward-only-merge": "allowFastForwardOnlyMerge",
    "allow-manual-merge": "allowManualMerge",
    "allow-merge-commits": "allowMergeCommits",
    "allow-rebase": "allowRebase",
    "allow-rebase-explicit": "allowRebaseExplicit",
    "allow-rebase-update": "allowRebaseUpdate",
    "allow-squash-merge": "allowSquashMerge",
    "autodetect-manual-merge": "autodetectManualMerge",
    "default-allow-maintainer-edit": "defaultAllowMaintainerEdit",
    "default-delete-branch-after-merge": "defaultDeleteBranchAfterMerge",
    "default-merge-style": "defaultMergeStyle",
    "default-update-style": "defaultUpdateStyle",
    "ignore-whitespace-conflicts": "ignoreWhitespaceConflicts",
  }
  for (const [key, value] of Object.entries(parsed.data.values))
    if (key !== "repo" && key !== "remote") options[map[key] ?? key] = value
  const target = forgejoCliNestedRepositoryTarget(parent.data, parsed.data)
  if (!target.success) return target
  return createResult({
    kind: "repo-units",
    unit,
    options,
    ...target.data,
    ...base,
  })
}

function forgejoCliIssueParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [rawSubcommand, ...subcommandArgs] = args
  if (!rawSubcommand) return createResult({ kind: "help", path: ["issue"] })
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (rawSubcommand === "create") return forgejoCliIssueCreateParse(subcommandArgs, base)
  if (rawSubcommand === "edit") return forgejoCliIssueEditParse(subcommandArgs, base)
  if (rawSubcommand === "comment") return forgejoCliIssueCommentParse(subcommandArgs, base)
  if (rawSubcommand === "assign" || rawSubcommand === "unassign")
    return forgejoCliIssueUsersParse(rawSubcommand, subcommandArgs, base)
  if (rawSubcommand === "close") return forgejoCliIssueCloseParse(subcommandArgs, base)
  if (rawSubcommand === "search") return forgejoCliIssueSearchParse(subcommandArgs, base)
  if (rawSubcommand === "view") return forgejoCliIssueViewParse(subcommandArgs, base)
  if (rawSubcommand === "templates") return forgejoCliIssueTemplatesParse(subcommandArgs, base)
  if (rawSubcommand === "browse") return forgejoCliIssueBrowseParse(subcommandArgs, base)
  if (rawSubcommand === "depend" || rawSubcommand === "block")
    return forgejoCliIssueRelationParse(rawSubcommand, subcommandArgs, base)
  if (rawSubcommand === "--help" || rawSubcommand === "-h") return createResult({ kind: "help", path: ["issue"] })
  return forgejoCliArgumentError(`Unknown issue command '${rawSubcommand}'`)
}

function forgejoCliBodyDefinitions(extra: readonly ForgejoCliOptionDefinition[] = []): ForgejoCliOptionDefinition[] {
  return [
    { name: "body", takesValue: true },
    { name: "body-file", takesValue: true },
    { name: "stdin", takesValue: false },
    { name: "editor", takesValue: false },
    ...extra,
  ]
}

function forgejoCliIssueCreateParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const definitions = forgejoCliIssueDefinitions(
    forgejoCliBodyDefinitions([
      { name: "title", takesValue: true },
      { name: "label", short: "l", takesValue: true, repeat: true },
      { name: "assignee", short: "a", takesValue: true, repeat: true },
      { name: "template", takesValue: true },
      { name: "no-template", takesValue: false },
      { name: "web", takesValue: false },
    ]),
  )
  const parsed = forgejoCliOptionsParse(args, definitions)
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "create"] })
  const title = forgejoCliString(parsed.data.values, "title") ?? parsed.data.positional[0]
  const rest =
    forgejoCliString(parsed.data.values, "title") === undefined
      ? parsed.data.positional.slice(1)
      : parsed.data.positional
  if (!forgejoCliBoolean(parsed.data.values, "web") && !title)
    return forgejoCliArgumentError("issue create requires a title")
  if (rest.length > 0) return forgejoCliArgumentError("issue create accepts one title")
  const body = forgejoCliString(parsed.data.values, "body")
  const bodyFile = forgejoCliString(parsed.data.values, "body-file")
  if (body !== undefined && (bodyFile !== undefined || forgejoCliBoolean(parsed.data.values, "stdin")))
    return forgejoCliArgumentError("Issue body was provided more than once")
  if (bodyFile !== undefined && forgejoCliBoolean(parsed.data.values, "stdin"))
    return forgejoCliArgumentError("Issue body was provided more than once")
  return createResult({
    kind: "issue-create",
    repository: forgejoCliString(parsed.data.values, "repo"),
    title: title ?? "",
    body,
    bodyFile,
    stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
    editor: forgejoCliBoolean(parsed.data.values, "editor"),
    labels: forgejoCliStrings(parsed.data.values, "label"),
    assignees: forgejoCliStrings(parsed.data.values, "assignee"),
    template: forgejoCliString(parsed.data.values, "template"),
    noTemplate: forgejoCliBoolean(parsed.data.values, "no-template"),
    web: forgejoCliBoolean(parsed.data.values, "web"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueEditParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["title", "body", "comment", "labels"], ["repo", "r", "remote", "R"])
  if (split.child) {
    const parent = forgejoCliOptionsParse(split.before, forgejoCliIssueDefinitions())
    if (!parent.success) return parent
    const reference = forgejoCliIssueReference(parent.data.positional, forgejoCliString(parent.data.values, "repo"))
    if (!reference.success) return reference
    if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue edit accepts one issue reference")
    const repository = forgejoCliString(parent.data.values, "repo")
    if (split.child === "title") {
      const titleParsed = forgejoCliOptionsParse(split.after, [{ name: "editor", takesValue: false }])
      if (!titleParsed.success) return titleParsed
      if (titleParsed.data.positional.length > 1) return forgejoCliArgumentError("issue edit title accepts one title")
      if (titleParsed.data.help) return createResult({ kind: "help", path: ["issue", "edit", "title"] })
      return createResult({
        kind: "issue-edit-title",
        issue: reference.data.issue ?? "",
        repository,
        value: titleParsed.data.positional[0],
        editor: forgejoCliBoolean(titleParsed.data.values, "editor"),
        remote: forgejoCliRemote(parent.data.values),
        ...base,
      })
    }
    if (split.child === "body") {
      const parsed = forgejoCliOptionsParse(split.after, forgejoCliBodyDefinitions())
      if (!parsed.success) return parsed
      if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "edit", "body"] })
      const body = forgejoCliString(parsed.data.values, "body") ?? parsed.data.positional[0]
      if (parsed.data.positional.length > 1) return forgejoCliArgumentError("issue edit body accepts one body")
      return createResult({
        kind: "issue-edit-body",
        issue: reference.data.issue ?? "",
        repository,
        body,
        bodyFile: forgejoCliString(parsed.data.values, "body-file"),
        stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
        editor: forgejoCliBoolean(parsed.data.values, "editor"),
        remote: forgejoCliRemote(parent.data.values),
        ...base,
      })
    }
    if (split.child === "comment") {
      const parsed = forgejoCliOptionsParse(split.after, forgejoCliBodyDefinitions())
      if (!parsed.success) return parsed
      if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "edit", "comment"] })
      const comment = forgejoCliIndex(parsed.data.positional[0], "comment index")
      if (!comment.success || comment.data === undefined)
        return comment.success ? forgejoCliArgumentError("issue edit comment requires a comment index") : comment
      const body = forgejoCliString(parsed.data.values, "body") ?? parsed.data.positional[1]
      if (parsed.data.positional.length > 2) return forgejoCliArgumentError("issue edit comment accepts one body")
      return createResult({
        kind: "issue-edit-comment",
        issue: reference.data.issue ?? "",
        repository,
        comment: comment.data,
        body,
        bodyFile: forgejoCliString(parsed.data.values, "body-file"),
        stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
        editor: forgejoCliBoolean(parsed.data.values, "editor"),
        remote: forgejoCliRemote(parent.data.values),
        ...base,
      })
    }
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "add", short: "a", takesValue: true, repeat: true },
      { name: "rm", short: "r", takesValue: true, repeat: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "edit", "labels"] })
    if (parsed.data.positional.length > 0)
      return forgejoCliArgumentError("issue edit labels accepts no positional arguments")
    return createResult({
      kind: "issue-edit-labels",
      issue: reference.data.issue ?? "",
      repository,
      add: forgejoCliStrings(parsed.data.values, "add"),
      remove: forgejoCliStrings(parsed.data.values, "rm"),
      remote: forgejoCliRemote(parent.data.values),
      ...base,
    })
  }
  const definitions = forgejoCliIssueDefinitions(
    forgejoCliBodyDefinitions([
      { name: "title", takesValue: true },
      { name: "state", takesValue: true },
      { name: "assignee", short: "a", takesValue: true, repeat: true },
      { name: "label-add", takesValue: true, repeat: true },
      { name: "label-remove", takesValue: true, repeat: true },
      { name: "yes", short: "y", takesValue: false },
    ]),
  )
  const parsed = forgejoCliOptionsParse(args, definitions)
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "edit"] })
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"), true)
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue edit accepts one issue reference")
  const state = forgejoCliString(parsed.data.values, "state")
  if (state !== undefined && state !== "open" && state !== "closed")
    return forgejoCliArgumentError("--state expects open or closed")
  const body = forgejoCliString(parsed.data.values, "body")
  const bodyFile = forgejoCliString(parsed.data.values, "body-file")
  if (body !== undefined && (bodyFile !== undefined || forgejoCliBoolean(parsed.data.values, "stdin")))
    return forgejoCliArgumentError("Issue body was provided more than once")
  return createResult({
    kind: "issue-edit",
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    title: forgejoCliString(parsed.data.values, "title"),
    body,
    bodyFile,
    stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
    editor: forgejoCliBoolean(parsed.data.values, "editor"),
    state: state as "open" | "closed" | undefined,
    assignees:
      parsed.data.values.assignee === undefined ? undefined : forgejoCliStrings(parsed.data.values, "assignee"),
    labelAdd: forgejoCliStrings(parsed.data.values, "label-add"),
    labelRemove: forgejoCliStrings(parsed.data.values, "label-remove"),
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueCommentParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliIssueDefinitions(forgejoCliBodyDefinitions()))
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "comment"] })
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue comment accepts one issue reference")
  const body = forgejoCliString(parsed.data.values, "body")
  const bodyFile = forgejoCliString(parsed.data.values, "body-file")
  if (body !== undefined && (bodyFile !== undefined || forgejoCliBoolean(parsed.data.values, "stdin")))
    return forgejoCliArgumentError("Comment body was provided more than once")
  return createResult({
    kind: "issue-comment",
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    body,
    bodyFile,
    stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
    editor: forgejoCliBoolean(parsed.data.values, "editor"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueUsersParse(
  kind: "assign" | "unassign",
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliIssueDefinitions())
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", kind] })
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length === 0) return forgejoCliArgumentError(`issue ${kind} requires at least one user`)
  return createResult({
    kind: `issue-${kind}`,
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    users: reference.data.rest,
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliIssueCloseParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliIssueDefinitions(
      forgejoCliBodyDefinitions([
        { name: "message", takesValue: true },
        { name: "yes", short: "y", takesValue: false },
      ]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "close"] })
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue close accepts one issue reference")
  return createResult({
    kind: "issue-close",
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    message: forgejoCliString(parsed.data.values, "message"),
    body: forgejoCliString(parsed.data.values, "body"),
    bodyFile: forgejoCliString(parsed.data.values, "body-file"),
    stdin: forgejoCliBoolean(parsed.data.values, "stdin"),
    editor: forgejoCliBoolean(parsed.data.values, "editor"),
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueSearchParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliIssueDefinitions(
      forgejoCliDefinitions(["labels", "creator", "assignee", "state", "page", "limit", "all"], [], ["all"]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "search"] })
  if (parsed.data.positional.length > 1) return forgejoCliArgumentError("issue search accepts one query")
  const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
  if (!page.success) return page
  const limit = forgejoCliNumber(forgejoCliString(parsed.data.values, "limit"), "--limit")
  if (!limit.success) return limit
  const state = forgejoCliString(parsed.data.values, "state")
  if (state !== undefined && state !== "open" && state !== "closed" && state !== "all")
    return forgejoCliArgumentError("--state expects open, closed, or all")
  return createResult({
    kind: "issue-search",
    repository: forgejoCliString(parsed.data.values, "repo"),
    query: parsed.data.positional[0],
    labels: forgejoCliString(parsed.data.values, "labels"),
    creator: forgejoCliString(parsed.data.values, "creator"),
    assignee: forgejoCliString(parsed.data.values, "assignee"),
    state: state as "open" | "closed" | "all" | undefined,
    page: page.data ?? 1,
    limit: limit.data ?? 50,
    all: forgejoCliBoolean(parsed.data.values, "all"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueViewParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["body", "comment", "comments", "assignees"], ["repo", "r", "remote", "R"])
  const before = split.before
  const parent = forgejoCliOptionsParse(before, forgejoCliIssueDefinitions())
  if (!parent.success) return parent
  const reference = forgejoCliIssueReference(parent.data.positional, forgejoCliString(parent.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue view accepts one issue reference")
  const repository = forgejoCliString(parent.data.values, "repo")
  if (!split.child)
    return createResult({
      kind: "issue-view",
      issue: reference.data.issue ?? "",
      repository,
      remote: forgejoCliRemote(parent.data.values),
      ...base,
    })
  const child = split.child as "body" | "comment" | "comments" | "assignees"
  if (child === "comment") {
    if (split.after.length !== 1) return forgejoCliArgumentError("issue view comment requires a comment index")
    const comment = forgejoCliIndex(split.after[0], "comment index")
    if (!comment.success || comment.data === undefined)
      return comment.success ? forgejoCliArgumentError("comment index is required") : comment
    return createResult({
      kind: "issue-view",
      issue: reference.data.issue ?? "",
      repository,
      view: child,
      comment: comment.data,
      remote: forgejoCliRemote(parent.data.values),
      ...base,
    })
  }
  if (split.after.length > 0) return forgejoCliArgumentError(`issue view ${child} accepts no arguments`)
  return createResult({
    kind: "issue-view",
    issue: reference.data.issue ?? "",
    repository,
    view: child,
    remote: forgejoCliRemote(parent.data.values),
    ...base,
  })
}

function forgejoCliIssueTemplatesParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliRepositoryDefinitions())
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "templates"] })
  if (parsed.data.positional.length > 0)
    return forgejoCliArgumentError("issue templates accepts no positional arguments")
  return createResult({
    kind: "issue-templates",
    repository: forgejoCliString(parsed.data.values, "repo"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueBrowseParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliIssueDefinitions())
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["issue", "browse"] })
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("issue browse accepts one issue reference")
  return createResult({
    kind: "issue-browse",
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliIssueRelationParse(
  kind: "depend" | "block",
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["add", "remove", "list"], ["repo", "r", "remote", "R", "yes", "y"])
  if (!split.child) return createResult({ kind: "help", path: ["issue", kind] })
  const childFirst = split.before.length === 0
  const parsed = forgejoCliOptionsParse(
    childFirst ? split.after : split.before,
    forgejoCliIssueDefinitions([{ name: "yes", short: "y", takesValue: false }]),
  )
  if (!parsed.success) return parsed
  const reference = forgejoCliIssueReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  const targets = childFirst ? reference.data.rest : split.after
  if (split.child !== "list" && targets.length === 0)
    return forgejoCliArgumentError(`${kind} ${split.child} requires at least one target`)
  if (split.child === "list" && targets.length > 0) return forgejoCliArgumentError(`${kind} list accepts no targets`)
  const operation = `${kind === "depend" ? "dependency" : "block"}-${split.child}` as ForgejoCliInvocation["kind"]
  return createResult({
    kind: `issue-${operation}`,
    issue: reference.data.issue ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    targets,
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as unknown as ForgejoCliInvocation)
}

function forgejoCliPullRequestDefinitions(
  extra: readonly ForgejoCliOptionDefinition[] = [],
): ForgejoCliOptionDefinition[] {
  return forgejoCliRepositoryDefinitions(extra)
}

function forgejoCliPullRequestReference(
  positional: readonly string[],
  repository: string | undefined,
  required = true,
): ForgejoResult<{ pr?: string; rest: string[] }> {
  const first = positional[0]
  if (first === undefined) {
    if (required) return forgejoCliArgumentError("A pull request reference is required")
    return createResult({ rest: [] })
  }
  if (repository !== undefined && first.includes("#"))
    return forgejoCliArgumentError("Use either a pull request repository reference or --repo")
  const reference = repository === undefined || first.includes("#") ? first : `${repository}#${first}`
  const separator = reference.lastIndexOf("#")
  const number = separator === -1 ? reference : reference.slice(separator + 1)
  if (!/^\^?\d+$/.test(number)) return forgejoCliArgumentError("Pull request number must be N or ^N")
  return createResult({ pr: reference, rest: positional.slice(1) })
}

function forgejoCliPullRequestInputFields(
  parsed: ForgejoCliParsedOptions,
): ForgejoResult<{ body?: string; bodyFile?: string; stdin: boolean; editor: boolean }> {
  const body = forgejoCliString(parsed.values, "body")
  const bodyFile = forgejoCliString(parsed.values, "body-file")
  const stdin = forgejoCliBoolean(parsed.values, "stdin")
  const editor = forgejoCliBoolean(parsed.values, "editor")
  if ([body !== undefined, bodyFile !== undefined, stdin, editor].filter(Boolean).length > 1)
    return forgejoCliArgumentError("Body input was provided more than once")
  return createResult({ body, bodyFile, stdin, editor })
}

function forgejoCliPullRequestParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [subcommand, ...subcommandArgs] = args
  if (!subcommand) return createResult({ kind: "help", path: ["pr"] })
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (subcommand === "search") return forgejoCliPullRequestSearchParse(subcommandArgs, base)
  if (subcommand === "create") return forgejoCliPullRequestCreateParse(subcommandArgs, base)
  if (subcommand === "view") return forgejoCliPullRequestViewParse(subcommandArgs, base)
  if (subcommand === "status") return forgejoCliPullRequestStatusParse(subcommandArgs, base)
  if (subcommand === "checkout") return forgejoCliPullRequestCheckoutParse(subcommandArgs, base)
  if (subcommand === "comment") return forgejoCliPullRequestCommentParse(subcommandArgs, base)
  if (subcommand === "assign" || subcommand === "unassign")
    return forgejoCliPullRequestUsersParse(subcommand, subcommandArgs, base)
  if (subcommand === "depend" || subcommand === "block")
    return forgejoCliPullRequestRelationParse(subcommand, subcommandArgs, base)
  if (subcommand === "edit") return forgejoCliPullRequestEditParse(subcommandArgs, base)
  if (subcommand === "close") return forgejoCliPullRequestCloseParse(subcommandArgs, base)
  if (subcommand === "merge") return forgejoCliPullRequestMergeParse(subcommandArgs, base)
  if (subcommand === "browse") return forgejoCliPullRequestBrowseParse(subcommandArgs, base)
  if (subcommand === "review") return forgejoCliPullRequestReviewParse(subcommandArgs, base)
  if (subcommand === "--help" || subcommand === "-h") return createResult({ kind: "help", path: ["pr"] })
  return forgejoCliArgumentError(`Unknown pr command '${subcommand}'`)
}

function forgejoCliPullRequestSearchParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions(
      forgejoCliDefinitions(["labels", "creator", "assignee", "state", "page", "limit", "all"], [], ["all"]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "search"] })
  if (parsed.data.positional.length > 1) return forgejoCliArgumentError("pr search accepts one query")
  const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
  if (!page.success) return page
  const limit = forgejoCliNumber(forgejoCliString(parsed.data.values, "limit"), "--limit")
  if (!limit.success) return limit
  const state = forgejoCliString(parsed.data.values, "state")
  if (state !== undefined && state !== "open" && state !== "closed" && state !== "all")
    return forgejoCliArgumentError("--state expects open, closed, or all")
  return createResult({
    kind: "pr-search",
    repository: forgejoCliString(parsed.data.values, "repo"),
    query: parsed.data.positional[0],
    labels: forgejoCliString(parsed.data.values, "labels"),
    creator: forgejoCliString(parsed.data.values, "creator"),
    assignee: forgejoCliString(parsed.data.values, "assignee"),
    state: state as "open" | "closed" | "all" | undefined,
    page: page.data ?? 1,
    limit: limit.data ?? 50,
    all: forgejoCliBoolean(parsed.data.values, "all"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestCreateParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions(
      forgejoCliBodyDefinitions([
        { name: "title", short: "t", takesValue: true },
        { name: "base", takesValue: true },
        { name: "head", takesValue: true },
        { name: "autofill", short: "A", takesValue: false },
        { name: "fill", takesValue: false, negativeFor: "autofill" },
        { name: "web", short: "w", takesValue: false },
      ]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "create"] })
  const titleOption = forgejoCliString(parsed.data.values, "title")
  const title = titleOption ?? parsed.data.positional[0]
  const rest = titleOption === undefined ? parsed.data.positional.slice(1) : parsed.data.positional
  if (rest.length > 0) return forgejoCliArgumentError("pr create accepts one title")
  const input = forgejoCliPullRequestInputFields(parsed.data)
  if (!input.success) return input
  const web = forgejoCliBoolean(parsed.data.values, "web")
  const autofill = forgejoCliBoolean(parsed.data.values, "autofill")
  if (!title && !web && !autofill) return forgejoCliArgumentError("pr create requires a title")
  if (forgejoCliString(parsed.data.values, "head") === "") return forgejoCliArgumentError("--head must not be empty")
  return createResult({
    kind: "pr-create",
    repository: forgejoCliString(parsed.data.values, "repo"),
    title,
    base: forgejoCliString(parsed.data.values, "base"),
    head: forgejoCliString(parsed.data.values, "head"),
    ...input.data,
    autofill,
    web,
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestViewParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(
    args,
    ["body", "comment", "comments", "labels", "assignees", "diff", "files", "commits"],
    ["repo", "r", "remote", "R"],
  )
  const parent = forgejoCliOptionsParse(split.before, forgejoCliPullRequestDefinitions())
  if (!parent.success) return parent
  const reference = forgejoCliPullRequestReference(parent.data.positional, forgejoCliString(parent.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr view accepts one pull request reference")
  const common = {
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parent.data.values, "repo"),
    remote: forgejoCliRemote(parent.data.values),
    ...base,
  }
  if (!split.child) return createResult({ kind: "pr-view", ...common })
  if (split.child === "comment") {
    if (split.after.length !== 1) return forgejoCliArgumentError("pr view comment requires a comment index")
    const comment = forgejoCliIndex(split.after[0], "comment index")
    if (!comment.success || comment.data === undefined)
      return comment.success ? forgejoCliArgumentError("comment index is required") : comment
    return createResult({ kind: "pr-view", ...common, view: "comment", comment: comment.data })
  }
  if (split.child === "diff") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "patch", short: "p", takesValue: false },
      { name: "editor", short: "e", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "view", "diff"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("pr view diff accepts no arguments")
    return createResult({
      kind: "pr-view",
      ...common,
      view: "diff",
      patch: forgejoCliBoolean(parsed.data.values, "patch"),
      editor: forgejoCliBoolean(parsed.data.values, "editor"),
    })
  }
  if (split.child === "commits") {
    const parsed = forgejoCliOptionsParse(split.after, [{ name: "oneline", short: "o", takesValue: false }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "view", "commits"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("pr view commits accepts no arguments")
    return createResult({
      kind: "pr-view",
      ...common,
      view: "commits",
      oneline: forgejoCliBoolean(parsed.data.values, "oneline"),
    })
  }
  if (split.after.length > 0) return forgejoCliArgumentError(`pr view ${split.child} accepts no arguments`)
  return createResult({
    kind: "pr-view",
    ...common,
    view: split.child as "body" | "comments" | "labels" | "assignees" | "files",
  })
}

function forgejoCliPullRequestReferenceParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
  kind: "pr-status" | "pr-browse" | "pr-review",
  extra: readonly ForgejoCliOptionDefinition[] = [],
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliPullRequestDefinitions(extra))
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", kind.slice(3)] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0)
    return forgejoCliArgumentError(`pr ${kind.slice(3)} accepts one pull request reference`)
  return createResult({
    kind,
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliPullRequestStatusParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const result = forgejoCliPullRequestReferenceParse(args, base, "pr-status", [{ name: "wait", takesValue: false }])
  if (!result.success) return result
  const parsed = forgejoCliOptionsParse(args, forgejoCliPullRequestDefinitions([{ name: "wait", takesValue: false }]))
  if (!parsed.success) return parsed
  return createResult({ ...result.data, wait: forgejoCliBoolean(parsed.data.values, "wait") } as ForgejoCliInvocation)
}

function forgejoCliPullRequestCheckoutParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions([
      { name: "branch", takesValue: true },
      { name: "ssh", short: "S", takesValue: false, booleanValue: true },
      { name: "no-ssh", takesValue: false, negativeFor: "ssh" },
      { name: "identity-file", short: "I", takesValue: true },
    ]),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "checkout"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr checkout accepts one pull request reference")
  return createResult({
    kind: "pr-checkout",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    branch: forgejoCliString(parsed.data.values, "branch"),
    ...(typeof parsed.data.values.ssh === "boolean" ? { ssh: parsed.data.values.ssh } : {}),
    identityFile: forgejoCliString(parsed.data.values, "identity-file"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestCommentParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliPullRequestDefinitions(forgejoCliBodyDefinitions()))
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "comment"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 1) return forgejoCliArgumentError("pr comment accepts one body")
  const input = forgejoCliPullRequestInputFields(parsed.data)
  if (!input.success) return input
  if (
    reference.data.rest.length > 0 &&
    (input.data.body !== undefined || input.data.bodyFile !== undefined || input.data.stdin || input.data.editor)
  )
    return forgejoCliArgumentError("Comment body was provided more than once")
  return createResult({
    kind: "pr-comment",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    ...input.data,
    body: input.data.body ?? reference.data.rest[0],
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestUsersParse(
  kind: "assign" | "unassign",
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, forgejoCliPullRequestDefinitions())
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", kind] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length === 0) return forgejoCliArgumentError(`pr ${kind} requires at least one user`)
  return createResult({
    kind: `pr-${kind}`,
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    users: reference.data.rest,
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliPullRequestCloseParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions(
      forgejoCliBodyDefinitions([
        { name: "message", takesValue: true },
        { name: "yes", short: "y", takesValue: false },
      ]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "close"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr close accepts one pull request reference")
  const input = forgejoCliPullRequestInputFields(parsed.data)
  if (!input.success) return input
  return createResult({
    kind: "pr-close",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    message: forgejoCliString(parsed.data.values, "message"),
    ...input.data,
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestMergeParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions([
      { name: "method", short: "M", takesValue: true },
      { name: "delete", short: "d", takesValue: false },
      { name: "title", short: "t", takesValue: true },
      { name: "message", short: "m", takesValue: true },
      { name: "editor", takesValue: false },
      { name: "yes", short: "y", takesValue: false },
    ]),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "merge"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr merge accepts one pull request reference")
  const method = forgejoCliString(parsed.data.values, "method")
  if (method !== undefined && !["merge", "rebase", "rebase-merge", "squash", "manual"].includes(method))
    return forgejoCliArgumentError("--method expects merge, rebase, rebase-merge, squash, or manual")
  if (
    method !== undefined &&
    ["rebase", "manual"].includes(method) &&
    forgejoCliString(parsed.data.values, "title") !== undefined
  )
    return forgejoCliArgumentError(`${method} does not support --title`)
  if (forgejoCliBoolean(parsed.data.values, "editor") && forgejoCliString(parsed.data.values, "message") !== undefined)
    return forgejoCliArgumentError("Merge message was provided more than once")
  return createResult({
    kind: "pr-merge",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    method: method as "merge" | "rebase" | "rebase-merge" | "squash" | "manual" | undefined,
    delete: forgejoCliBoolean(parsed.data.values, "delete"),
    title: forgejoCliString(parsed.data.values, "title"),
    message: forgejoCliString(parsed.data.values, "message"),
    editor: forgejoCliBoolean(parsed.data.values, "editor"),
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestBrowseParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  return forgejoCliPullRequestReferenceParse(args, base, "pr-browse")
}

function forgejoCliPullRequestReviewParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["list"], ["repo", "r", "remote", "R"])
  const parsed = forgejoCliOptionsParse(split.before, forgejoCliPullRequestDefinitions())
  if (!parsed.success) return parsed
  if (!split.child) {
    if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "review"] })
    const reference = forgejoCliPullRequestReference(
      parsed.data.positional,
      forgejoCliString(parsed.data.values, "repo"),
    )
    if (!reference.success) return reference
    if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr review accepts one pull request reference")
    return createResult({
      kind: "pr-review",
      pr: reference.data.pr ?? "",
      repository: forgejoCliString(parsed.data.values, "repo"),
      comments: false,
      all: false,
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "review", "list"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr review accepts one pull request reference")
  const child = forgejoCliOptionsParse(split.after, [
    { name: "comments", short: "c", takesValue: false },
    { name: "all", short: "a", takesValue: false },
  ])
  if (!child.success) return child
  if (child.data.help) return createResult({ kind: "help", path: ["pr", "review", "list"] })
  if (child.data.positional.length > 0) return forgejoCliArgumentError("pr review list accepts no extra arguments")
  return createResult({
    kind: "pr-review",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    comments: forgejoCliBoolean(child.data.values, "comments"),
    all: forgejoCliBoolean(child.data.values, "all"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliPullRequestRelationParse(
  kind: "depend" | "block",
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["add", "remove", "list"], ["repo", "r", "remote", "R", "yes", "y"])
  if (!split.child) return createResult({ kind: "help", path: ["pr", kind] })
  const childFirst = split.before.length === 0
  const parsed = forgejoCliOptionsParse(
    childFirst ? split.after : split.before,
    forgejoCliPullRequestDefinitions([{ name: "yes", short: "y", takesValue: false }]),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", kind, split.child] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  const targets = childFirst ? reference.data.rest : split.after
  if (split.child === "list" && targets.length > 0) return forgejoCliArgumentError(`pr ${kind} list accepts no targets`)
  if (split.child !== "list" && targets.length === 0)
    return forgejoCliArgumentError(`pr ${kind} ${split.child} requires at least one target`)
  return createResult({
    kind: `pr-${kind === "depend" ? "dependency" : "block"}-${split.child}`,
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    targets,
    yes: forgejoCliBoolean(parsed.data.values, "yes"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliResourceParentParse(args: readonly string[]): ForgejoResult<ForgejoCliParsedOptions> {
  return forgejoCliOptionsParse(args, forgejoCliRepositoryDefinitions())
}

function forgejoCliResourceRepository(
  parent: ForgejoCliParsedOptions,
  child: ForgejoCliParsedOptions,
): ForgejoResult<{ repository?: string; remote?: string }> {
  const parentRepository = forgejoCliString(parent.values, "repo")
  const childRepository = forgejoCliString(child.values, "repo")
  const parentRemote = forgejoCliRemote(parent.values)
  const childRemote = forgejoCliRemote(child.values)
  if (parentRepository !== undefined && childRepository !== undefined)
    return forgejoCliArgumentError("Repository was provided more than once")
  if (parentRemote !== undefined && childRemote !== undefined)
    return forgejoCliArgumentError("Remote was provided more than once")
  return createResult({
    ...((childRepository ?? parentRepository) ? { repository: childRepository ?? parentRepository } : {}),
    ...((childRemote ?? parentRemote) ? { remote: childRemote ?? parentRemote } : {}),
  })
}

function forgejoCliOptionalBody(
  values: ForgejoCliParsedOptions["values"],
): ForgejoResult<{ body?: string; bodyFile?: string; stdin: boolean; editor: boolean }> {
  const bodyValue = values.body
  const body = typeof bodyValue === "string" ? bodyValue : undefined
  const bodyFile = forgejoCliString(values, "body-file")
  const stdin = forgejoCliBoolean(values, "stdin")
  const editor = bodyValue === true || forgejoCliBoolean(values, "editor")
  if ([body !== undefined, bodyFile !== undefined, stdin, editor].filter(Boolean).length > 1)
    return forgejoCliArgumentError("Body input was provided more than once")
  return createResult({ body, bodyFile, stdin, editor })
}

function forgejoCliReleaseBodyDefinitions(): ForgejoCliOptionDefinition[] {
  return [
    { name: "body", short: "b", optionalValue: true },
    { name: "body-file", takesValue: true },
    { name: "stdin", takesValue: false },
    { name: "editor", takesValue: false },
  ]
}

function forgejoCliReleaseParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(
    args,
    ["create", "edit", "delete", "list", "view", "browse", "asset"],
    ["repo", "r", "remote", "R"],
  )
  if (!split.child) return createResult({ kind: "help", path: ["release"] })
  const parent = forgejoCliResourceParentParse(split.before)
  if (!parent.success) return parent
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (split.child === "asset") return forgejoCliReleaseAssetParse(split.after, parent.data, base)
  const repositoryDefinitions = forgejoCliRepositoryDefinitions()
  if (split.child === "create") {
    const parsed = forgejoCliOptionsParse(split.after, [
      ...repositoryDefinitions,
      { name: "tag", short: "t", takesValue: true },
      { name: "create-tag", short: "T", optionalValue: true },
      { name: "attach", short: "a", takesValue: true, repeat: true },
      ...forgejoCliReleaseBodyDefinitions(),
      { name: "branch", short: "B", takesValue: true },
      { name: "draft", short: "d", takesValue: false },
      { name: "prerelease", short: "p", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "create"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("release create requires NAME")
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    const tag = forgejoCliString(parsed.data.values, "tag")
    const createTagValue = parsed.data.values["create-tag"]
    const createTag = createTagValue !== undefined
    if (tag === undefined && !createTag) return forgejoCliArgumentError("release create requires --tag or --create-tag")
    if (tag !== undefined && createTag) return forgejoCliArgumentError("Use either --tag or --create-tag")
    const body = forgejoCliOptionalBody(parsed.data.values)
    if (!body.success) return body
    return createResult({
      kind: "release-create",
      name: parsed.data.positional[0] ?? "",
      tag,
      createTag,
      ...(typeof createTagValue === "string" ? { createTagName: createTagValue } : {}),
      attach: forgejoCliStrings(parsed.data.values, "attach"),
      ...body.data,
      branch: forgejoCliString(parsed.data.values, "branch"),
      draft: forgejoCliBoolean(parsed.data.values, "draft"),
      prerelease: forgejoCliBoolean(parsed.data.values, "prerelease"),
      ...repository.data,
      ...base,
    })
  }
  if (split.child === "edit") {
    const parsed = forgejoCliOptionsParse(split.after, [
      ...repositoryDefinitions,
      { name: "rename", short: "n", takesValue: true },
      { name: "tag", short: "t", takesValue: true },
      ...forgejoCliReleaseBodyDefinitions(),
      { name: "draft", takesValue: false, booleanValue: true },
      { name: "prerelease", takesValue: false, booleanValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "edit"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("release edit requires NAME")
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    const body = forgejoCliOptionalBody(parsed.data.values)
    if (!body.success) return body
    return createResult({
      kind: "release-edit",
      name: parsed.data.positional[0] ?? "",
      rename: forgejoCliString(parsed.data.values, "rename"),
      tag: forgejoCliString(parsed.data.values, "tag"),
      ...body.data,
      ...(typeof parsed.data.values.draft === "boolean" ? { draft: parsed.data.values.draft } : {}),
      ...(typeof parsed.data.values.prerelease === "boolean" ? { prerelease: parsed.data.values.prerelease } : {}),
      ...repository.data,
      ...base,
    })
  }
  if (split.child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [
      ...repositoryDefinitions,
      { name: "include-prerelease", short: "p", takesValue: false },
      { name: "include-draft", short: "d", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "list"] })
    if (parsed.data.positional.length > 0)
      return forgejoCliArgumentError("release list accepts no positional arguments")
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    return createResult({
      kind: "release-list",
      includePrerelease: forgejoCliBoolean(parsed.data.values, "include-prerelease"),
      includeDraft: forgejoCliBoolean(parsed.data.values, "include-draft"),
      ...repository.data,
      ...base,
    })
  }
  if (split.child === "browse") {
    const parsed = forgejoCliOptionsParse(split.after, repositoryDefinitions)
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "browse"] })
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError("release browse accepts one NAME")
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    return createResult({ kind: "release-browse", name: parsed.data.positional[0], ...repository.data, ...base })
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    ...repositoryDefinitions,
    { name: "by-tag", short: "t", takesValue: false },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["release", split.child] })
  if (parsed.data.positional.length !== 1) return forgejoCliArgumentError(`release ${split.child} requires NAME`)
  const repository = forgejoCliResourceRepository(parent.data, parsed.data)
  if (!repository.success) return repository
  if (split.child === "delete" || split.child === "view")
    return createResult({
      kind: `release-${split.child}`,
      name: parsed.data.positional[0] ?? "",
      byTag: forgejoCliBoolean(parsed.data.values, "by-tag"),
      ...repository.data,
      ...base,
    } as ForgejoCliInvocation)
  return forgejoCliArgumentError(`Unknown release command '${split.child}'`)
}

function forgejoCliReleaseAssetParse(
  args: readonly string[],
  parent: ForgejoCliParsedOptions,
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["create", "delete", "download"], ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["release", "asset"] })
  const definitions = forgejoCliRepositoryDefinitions()
  if (split.child === "create") {
    const parsed = forgejoCliOptionsParse(split.after, definitions)
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "asset", "create"] })
    if (parsed.data.positional.length < 2 || parsed.data.positional.length > 3)
      return forgejoCliArgumentError("release asset create requires RELEASE FILE [ASSET_NAME]")
    const repository = forgejoCliResourceRepository(parent, parsed.data)
    if (!repository.success) return repository
    return createResult({
      kind: "release-asset-create",
      release: parsed.data.positional[0] ?? "",
      file: parsed.data.positional[1] ?? "",
      assetName: parsed.data.positional[2],
      ...repository.data,
      ...base,
    })
  }
  if (split.child === "delete") {
    const parsed = forgejoCliOptionsParse(split.after, definitions)
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["release", "asset", "delete"] })
    if (parsed.data.positional.length !== 2)
      return forgejoCliArgumentError("release asset delete requires RELEASE ASSET")
    const repository = forgejoCliResourceRepository(parent, parsed.data)
    if (!repository.success) return repository
    return createResult({
      kind: "release-asset-delete",
      release: parsed.data.positional[0] ?? "",
      asset: parsed.data.positional[1] ?? "",
      ...repository.data,
      ...base,
    })
  }
  const parsed = forgejoCliOptionsParse(split.after, [...definitions, { name: "output", short: "o", takesValue: true }])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["release", "asset", "download"] })
  if (parsed.data.positional.length !== 2)
    return forgejoCliArgumentError("release asset download requires RELEASE ASSET")
  const repository = forgejoCliResourceRepository(parent, parsed.data)
  if (!repository.success) return repository
  return createResult({
    kind: "release-asset-download",
    release: parsed.data.positional[0] ?? "",
    asset: parsed.data.positional[1] ?? "",
    output: forgejoCliString(parsed.data.values, "output"),
    ...repository.data,
    ...base,
  })
}

function forgejoCliTagParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["create", "delete", "list", "view"], ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["tag"] })
  const parent = forgejoCliResourceParentParse(split.before)
  if (!parent.success) return parent
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  const definitions = forgejoCliRepositoryDefinitions()
  if (split.child === "create") {
    const parsed = forgejoCliOptionsParse(split.after, [
      ...definitions,
      ...forgejoCliReleaseBodyDefinitions(),
      { name: "branch", short: "B", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["tag", "create"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("tag create requires NAME")
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    const body = forgejoCliOptionalBody(parsed.data.values)
    if (!body.success) return body
    return createResult({
      kind: "tag-create",
      name: parsed.data.positional[0] ?? "",
      ...body.data,
      branch: forgejoCliString(parsed.data.values, "branch"),
      ...repository.data,
      ...base,
    })
  }
  if (split.child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [...definitions, { name: "page", short: "p", takesValue: true }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["tag", "list"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("tag list accepts no positional arguments")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    const repository = forgejoCliResourceRepository(parent.data, parsed.data)
    if (!repository.success) return repository
    return createResult({ kind: "tag-list", page: page.data ?? 1, ...repository.data, ...base })
  }
  const parsed = forgejoCliOptionsParse(split.after, definitions)
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["tag", split.child] })
  if (parsed.data.positional.length !== 1) return forgejoCliArgumentError(`tag ${split.child} requires NAME`)
  const repository = forgejoCliResourceRepository(parent.data, parsed.data)
  if (!repository.success) return repository
  return createResult({
    kind: `tag-${split.child}`,
    name: parsed.data.positional[0] ?? "",
    ...repository.data,
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliPullRequestEditParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["title", "body", "comment", "labels"], ["repo", "r", "remote", "R"])
  if (split.child) {
    const parent = forgejoCliOptionsParse(split.before, forgejoCliPullRequestDefinitions())
    if (!parent.success) return parent
    const reference = forgejoCliPullRequestReference(
      parent.data.positional,
      forgejoCliString(parent.data.values, "repo"),
    )
    if (!reference.success) return reference
    if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr edit accepts one pull request reference")
    const common = {
      pr: reference.data.pr ?? "",
      repository: forgejoCliString(parent.data.values, "repo"),
      remote: forgejoCliRemote(parent.data.values),
      ...base,
    }
    if (split.child === "title") {
      const child = forgejoCliOptionsParse(split.after, [{ name: "editor", takesValue: false }])
      if (!child.success) return child
      if (child.data.positional.length > 1) return forgejoCliArgumentError("pr edit title accepts one title")
      return createResult({
        kind: "pr-edit-title",
        ...common,
        value: child.data.positional[0],
        editor: forgejoCliBoolean(child.data.values, "editor"),
      })
    }
    if (split.child === "labels") {
      const child = forgejoCliOptionsParse(split.after, [
        { name: "add", short: "a", takesValue: true, repeat: true },
        { name: "rm", short: "r", takesValue: true, repeat: true },
      ])
      if (!child.success) return child
      return createResult({
        kind: "pr-edit-labels",
        ...common,
        add: forgejoCliStrings(child.data.values, "add"),
        remove: forgejoCliStrings(child.data.values, "rm"),
      })
    }
    const child = forgejoCliOptionsParse(split.after, forgejoCliBodyDefinitions())
    if (!child.success) return child
    const input = forgejoCliPullRequestInputFields(child.data)
    if (!input.success) return input
    if (split.child === "comment") {
      const comment = forgejoCliIndex(child.data.positional[0], "comment index")
      if (!comment.success || comment.data === undefined)
        return comment.success ? forgejoCliArgumentError("comment index is required") : comment
      if (child.data.positional.length > 2) return forgejoCliArgumentError("pr edit comment accepts one body")
      if (
        child.data.positional[1] !== undefined &&
        (input.data.body !== undefined || input.data.bodyFile !== undefined || input.data.stdin || input.data.editor)
      )
        return forgejoCliArgumentError("Comment body was provided more than once")
      return createResult({
        kind: "pr-edit-comment",
        ...common,
        comment: comment.data,
        ...input.data,
        body: input.data.body ?? child.data.positional[1],
      })
    }
    if (child.data.positional.length > 1) return forgejoCliArgumentError("pr edit body accepts one body")
    if (
      child.data.positional.length > 0 &&
      (input.data.body !== undefined || input.data.bodyFile !== undefined || input.data.stdin || input.data.editor)
    )
      return forgejoCliArgumentError("Body input was provided more than once")
    return createResult({
      kind: "pr-edit-body",
      ...common,
      ...input.data,
      body: input.data.body ?? child.data.positional[0],
    })
  }
  const parsed = forgejoCliOptionsParse(
    args,
    forgejoCliPullRequestDefinitions(
      forgejoCliBodyDefinitions([
        { name: "title", takesValue: true },
        { name: "state", takesValue: true },
        { name: "assignee", short: "a", takesValue: true, repeat: true },
        { name: "label-add", takesValue: true, repeat: true },
        { name: "label-remove", takesValue: true, repeat: true },
      ]),
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["pr", "edit"] })
  const reference = forgejoCliPullRequestReference(parsed.data.positional, forgejoCliString(parsed.data.values, "repo"))
  if (!reference.success) return reference
  if (reference.data.rest.length > 0) return forgejoCliArgumentError("pr edit accepts one pull request reference")
  const state = forgejoCliString(parsed.data.values, "state")
  if (state !== undefined && state !== "open" && state !== "closed")
    return forgejoCliArgumentError("--state expects open or closed")
  const input = forgejoCliPullRequestInputFields(parsed.data)
  if (!input.success) return input
  return createResult({
    kind: "pr-edit",
    pr: reference.data.pr ?? "",
    repository: forgejoCliString(parsed.data.values, "repo"),
    title: forgejoCliString(parsed.data.values, "title"),
    ...input.data,
    state: state as "open" | "closed" | undefined,
    assignees:
      parsed.data.values.assignee === undefined ? undefined : forgejoCliStrings(parsed.data.values, "assignee"),
    labelAdd: forgejoCliStrings(parsed.data.values, "label-add"),
    labelRemove: forgejoCliStrings(parsed.data.values, "label-remove"),
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  })
}

function forgejoCliRepositoryOptionsMerge(
  ...parsedValues: readonly ForgejoCliParsedOptions[]
): ForgejoResult<{ repository?: string; remote?: string }> {
  let repository: string | undefined
  let remote: string | undefined
  for (const parsed of parsedValues) {
    const nextRepository = forgejoCliString(parsed.values, "repo")
    const nextRemote = forgejoCliString(parsed.values, "remote")
    if (nextRepository !== undefined) {
      if (repository !== undefined) return forgejoCliArgumentError("Repository was provided more than once")
      repository = nextRepository
    }
    if (nextRemote !== undefined) {
      if (remote !== undefined) return forgejoCliArgumentError("Remote was provided more than once")
      remote = nextRemote
    }
  }
  return createResult({ repository, remote })
}

function forgejoCliNestedRepositoryTarget(
  parent: ForgejoCliParsedOptions,
  child: ForgejoCliParsedOptions,
): ForgejoResult<{ repository?: string; remote?: string }> {
  const parentTarget = forgejoCliRepositoryTarget(parent, parent.positional, false)
  if (!parentTarget.success) return parentTarget
  if (parentTarget.data.rest.length > 0) return forgejoCliArgumentError("Repository accepts one repository")
  const merged = forgejoCliRepositoryOptionsMerge(parent, child)
  if (!merged.success) return merged
  const childRepository = forgejoCliString(child.values, "repo")
  if (parentTarget.data.repository !== undefined && childRepository !== undefined)
    return forgejoCliArgumentError("Repository was provided more than once")
  return createResult({
    ...((childRepository ?? parentTarget.data.repository)
      ? { repository: childRepository ?? parentTarget.data.repository }
      : {}),
    ...(merged.data.remote === undefined ? {} : { remote: merged.data.remote }),
  })
}

function forgejoCliNestedRemote(
  parent: ForgejoCliParsedOptions,
  child: ForgejoCliParsedOptions,
): ForgejoResult<{ remote?: string }> {
  const merged = forgejoCliRepositoryOptionsMerge(parent, child)
  if (!merged.success) return merged
  return createResult(merged.data.remote === undefined ? {} : { remote: merged.data.remote })
}

function forgejoCliWikiParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["contents", "view", "clone", "browse"], ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["wiki"] })
  const parent = forgejoCliOptionsParse(split.before, forgejoCliRepositoryDefinitions())
  if (!parent.success) return parent
  if (parent.data.positional.length > 1) return forgejoCliArgumentError("wiki accepts one repository")
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  const childDefinitions = forgejoCliRepositoryDefinitions(
    split.child === "clone"
      ? [
          { name: "path", short: "p", takesValue: true },
          { name: "ssh", short: "S", takesValue: false, booleanValue: true },
          { name: "no-ssh", takesValue: false, negativeFor: "ssh" },
          { name: "identity-file", short: "I", takesValue: true },
        ]
      : [],
  )
  const child = forgejoCliOptionsParse(split.after, childDefinitions)
  if (!child.success) return child
  if (child.data.help) return createResult({ kind: "help", path: ["wiki", split.child] })
  const merged = forgejoCliRepositoryOptionsMerge(parent.data, child.data)
  if (!merged.success) return merged
  const repository = merged.data.repository ?? parent.data.positional[0]
  if (split.child === "contents") {
    if (child.data.positional.length > 0)
      return forgejoCliArgumentError("wiki contents accepts no positional arguments")
    return createResult({ kind: "wiki-contents", repository, remote: merged.data.remote, ...base })
  }
  if (split.child === "view" || split.child === "browse") {
    if (child.data.positional.length !== 1) return forgejoCliArgumentError(`wiki ${split.child} requires PAGE`)
    return createResult({
      kind: split.child === "view" ? "wiki-view" : "wiki-browse",
      repository,
      page: child.data.positional[0] ?? "",
      remote: merged.data.remote,
      ...base,
    })
  }
  if (child.data.positional.length > 1) return forgejoCliArgumentError("wiki clone accepts one destination path")
  return createResult({
    kind: "wiki-clone",
    repository,
    path: forgejoCliString(child.data.values, "path") ?? child.data.positional[0],
    ...(typeof child.data.values.ssh === "boolean" ? { ssh: child.data.values.ssh } : {}),
    identityFile: forgejoCliString(child.data.values, "identity-file"),
    remote: merged.data.remote,
    ...base,
  })
}

function forgejoCliActionsParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["tasks", "variables", "secrets", "dispatch"], ["repo", "r", "remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["actions"] })
  const root = forgejoCliOptionsParse(split.before, forgejoCliRepositoryDefinitions())
  if (!root.success) return root
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (split.child === "tasks") {
    const parsed = forgejoCliOptionsParse(
      split.after,
      forgejoCliRepositoryDefinitions([{ name: "page", short: "p", takesValue: true }]),
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["actions", "tasks"] })
    if (parsed.data.positional.length > 0)
      return forgejoCliArgumentError("actions tasks accepts no positional arguments")
    const merged = forgejoCliRepositoryOptionsMerge(root.data, parsed.data)
    if (!merged.success) return merged
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page") ?? "1", "--page")
    if (!page.success || page.data === undefined)
      return page.success ? forgejoCliArgumentError("--page is required") : page
    return createResult({
      kind: "actions-tasks",
      repository: merged.data.repository ?? root.data.positional[0],
      page: page.data,
      remote: merged.data.remote,
      ...base,
    })
  }
  if (split.child === "dispatch") {
    const parsed = forgejoCliOptionsParse(
      split.after,
      forgejoCliRepositoryDefinitions([{ name: "inputs", short: "I", takesValue: true, repeat: true }]),
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["actions", "dispatch"] })
    if (parsed.data.positional.length !== 2) return forgejoCliArgumentError("actions dispatch requires NAME and REF")
    const merged = forgejoCliRepositoryOptionsMerge(root.data, parsed.data)
    if (!merged.success) return merged
    const inputs: Record<string, string> = {}
    for (const raw of forgejoCliStrings(parsed.data.values, "inputs")) {
      const equals = raw.indexOf("=")
      if (equals < 1) return forgejoCliArgumentError("actions dispatch inputs must use KEY=VALUE")
      inputs[raw.slice(0, equals)] = raw.slice(equals + 1)
    }
    return createResult({
      kind: "actions-dispatch",
      repository: merged.data.repository ?? root.data.positional[0],
      name: parsed.data.positional[0] ?? "",
      ref: parsed.data.positional[1] ?? "",
      inputs,
      remote: merged.data.remote,
      ...base,
    })
  }
  const groupSplit = forgejoCliNestedSplit(split.after, ["list", "create", "delete"], ["repo", "r", "remote", "R"])
  if (!groupSplit.child) return createResult({ kind: "help", path: ["actions", split.child] })
  const group = forgejoCliOptionsParse(groupSplit.before, forgejoCliRepositoryDefinitions())
  if (!group.success) return group
  const parsed = forgejoCliOptionsParse(
    groupSplit.after,
    forgejoCliRepositoryDefinitions(
      split.child === "variables" && groupSplit.child === "list"
        ? [{ name: "verbose", short: "v", takesValue: false }]
        : split.child === "variables" && groupSplit.child === "create"
          ? [{ name: "force", short: "f", takesValue: false }]
          : groupSplit.child === "delete"
            ? [
                { name: "yes", short: "y", takesValue: false },
                { name: "force", takesValue: false },
              ]
            : [],
    ),
  )
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["actions", split.child, groupSplit.child] })
  const merged = forgejoCliRepositoryOptionsMerge(root.data, group.data, parsed.data)
  if (!merged.success) return merged
  const repository = merged.data.repository ?? root.data.positional[0]
  const positional = parsed.data.positional
  if (split.child === "variables" && groupSplit.child === "list") {
    if (positional.length > 0) return forgejoCliArgumentError("actions variables list accepts no positional arguments")
    return createResult({
      kind: "actions-variables-list",
      repository,
      verbose: forgejoCliBoolean(parsed.data.values, "verbose"),
      remote: merged.data.remote,
      ...base,
    })
  }
  if (split.child === "secrets" && groupSplit.child === "list") {
    if (positional.length > 0) return forgejoCliArgumentError("actions secrets list accepts no positional arguments")
    return createResult({ kind: "actions-secrets-list", repository, remote: merged.data.remote, ...base })
  }
  if (groupSplit.child === "create") {
    if (split.child === "variables") {
      if (positional.length < 1 || positional.length > 2)
        return forgejoCliArgumentError("actions variables create requires NAME and optional DATA")
      return createResult({
        kind: "actions-variables-create",
        repository,
        name: positional[0] ?? "",
        data: positional[1],
        force: forgejoCliBoolean(parsed.data.values, "force"),
        remote: merged.data.remote,
        ...base,
      })
    }
    if (positional.length !== 2) return forgejoCliArgumentError("actions secrets create requires NAME and DATA")
    return createResult({
      kind: "actions-secrets-create",
      repository,
      name: positional[0] ?? "",
      data: positional[1] ?? "",
      remote: merged.data.remote,
      ...base,
    })
  }
  if (groupSplit.child === "delete") {
    if (positional.length !== 1) return forgejoCliArgumentError(`actions ${split.child} delete requires NAME`)
    return createResult({
      kind: split.child === "variables" ? "actions-variables-delete" : "actions-secrets-delete",
      repository,
      name: positional[0] ?? "",
      yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
      remote: merged.data.remote,
      ...base,
    })
  }
  return forgejoCliArgumentError(`Unknown actions command '${split.child} ${groupSplit.child}'`)
}

function forgejoCliUserParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [rawSubcommand, ...subcommandArgs] = args
  if (!rawSubcommand) return createResult({ kind: "help", path: ["user"] })
  const subcommand = rawSubcommand === "keys" ? "key" : rawSubcommand
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  const remoteDefinitions = [{ name: "remote", short: "R", takesValue: true }]
  if (subcommand === "search") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      ...remoteDefinitions,
      { name: "page", short: "p", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "search"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("user search requires one query")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    return createResult({
      kind: "user-search",
      query: parsed.data.positional[0] ?? "",
      page: page.data ?? 1,
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (["view", "browse", "following", "followers", "orgs", "activity"].includes(subcommand)) {
    const parsed = forgejoCliOptionsParse(subcommandArgs, remoteDefinitions)
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", subcommand] })
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError(`user ${subcommand} accepts at most one user`)
    return createResult({
      kind: `user-${subcommand}`,
      ...(parsed.data.positional[0] === undefined ? {} : { user: parsed.data.positional[0] }),
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    } as ForgejoCliInvocation)
  }
  if (["follow", "unfollow", "block", "unblock"].includes(subcommand)) {
    const parsed = forgejoCliOptionsParse(subcommandArgs, remoteDefinitions)
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", subcommand] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError(`user ${subcommand} requires one user`)
    return createResult({
      kind: `user-${subcommand}`,
      user: parsed.data.positional[0] ?? "",
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    } as ForgejoCliInvocation)
  }
  if (subcommand === "repos") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      ...remoteDefinitions,
      { name: "starred", takesValue: false },
      { name: "sort", takesValue: true },
      { name: "page", short: "p", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "repos"] })
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError("user repos accepts at most one user")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    const sort = forgejoCliString(parsed.data.values, "sort")
    if (sort !== undefined && !["name", "modified", "created", "stars", "forks"].includes(sort))
      return forgejoCliArgumentError("--sort expects name, modified, created, stars, or forks")
    return createResult({
      kind: "user-repos",
      ...(parsed.data.positional[0] === undefined ? {} : { user: parsed.data.positional[0] }),
      starred: forgejoCliBoolean(parsed.data.values, "starred"),
      sort: sort as "name" | "modified" | "created" | "stars" | "forks" | undefined,
      page: page.data ?? 1,
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (subcommand === "edit") return forgejoCliUserEditParse(subcommandArgs, base)
  if (subcommand === "key") return forgejoCliUserKeyParse(subcommandArgs, base)
  if (subcommand === "gpg") return forgejoCliUserGpgParse(subcommandArgs, base)
  if (subcommand === "--help" || subcommand === "-h") return createResult({ kind: "help", path: ["user"] })
  return forgejoCliArgumentError(`Unknown user command '${rawSubcommand}'`)
}

function forgejoCliUserEditParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(
    args,
    ["bio", "name", "pronouns", "location", "activity", "email", "website"],
    ["remote", "R"],
  )
  if (!split.child) return createResult({ kind: "help", path: ["user", "edit"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  const child = split.child
  if (["bio", "name", "pronouns", "location", "website"].includes(child)) {
    const parsed = forgejoCliOptionsParse(
      split.after,
      child === "bio"
        ? [{ name: "remote", short: "R", takesValue: true }]
        : [
            { name: "remote", short: "R", takesValue: true },
            { name: "unset", short: "u", takesValue: false },
          ],
    )
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "edit", child] })
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError(`user edit ${child} accepts one value`)
    if (forgejoCliBoolean(parsed.data.values, "unset") && parsed.data.positional.length > 0)
      return forgejoCliArgumentError(`user edit ${child} cannot combine a value with --unset`)
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "user-edit",
      edit: {
        field: child as "bio" | "name" | "pronouns" | "location" | "website",
        value: parsed.data.positional[0],
        unset: forgejoCliBoolean(parsed.data.values, "unset"),
      } as {
        field: "bio" | "name" | "pronouns" | "location" | "website"
        value?: string
        unset: boolean
      },
      ...merged.data,
      ...base,
    } as ForgejoCliInvocation)
  }
  if (child === "activity") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "visibility", short: "v", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "edit", "activity"] })
    if (parsed.data.positional.length > 0)
      return forgejoCliArgumentError("user edit activity accepts no positional arguments")
    const visibility = forgejoCliString(parsed.data.values, "visibility")
    if (visibility !== "hidden" && visibility !== "public")
      return forgejoCliArgumentError("--visibility expects hidden or public")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({ kind: "user-edit", edit: { field: "activity", visibility }, ...merged.data, ...base })
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "visibility", short: "v", takesValue: true },
    { name: "add", short: "a", takesValue: true, repeat: true },
    { name: "rm", short: "r", takesValue: true, repeat: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["user", "edit", "email"] })
  if (parsed.data.positional.length > 0)
    return forgejoCliArgumentError("user edit email accepts no positional arguments")
  const visibility = forgejoCliString(parsed.data.values, "visibility")
  if (visibility !== undefined && visibility !== "hidden" && visibility !== "public")
    return forgejoCliArgumentError("--visibility expects hidden or public")
  const merged = forgejoCliNestedRemote(parent.data, parsed.data)
  if (!merged.success) return merged
  return createResult({
    kind: "user-edit",
    edit: {
      field: "email",
      ...(visibility === undefined ? {} : { visibility: visibility as "hidden" | "public" }),
      add: forgejoCliStrings(parsed.data.values, "add"),
      remove: forgejoCliStrings(parsed.data.values, "rm"),
    },
    ...merged.data,
    ...base,
  })
}

function forgejoCliUserKeyParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["list", "view", "delete", "upload"], ["remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["user", "key"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  if (split.child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "verbose", short: "v", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "key", "list"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("user key list accepts no arguments")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "user-key-list",
      verbose: forgejoCliBoolean(parsed.data.values, "verbose"),
      ...merged.data,
      ...base,
    })
  }
  if (split.child === "view" || split.child === "delete") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "yes", short: "y", takesValue: false },
      { name: "force", short: "f", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "key", split.child] })
    const id = forgejoCliNumber(parsed.data.positional[0], "key id")
    if (!id.success || id.data === undefined) return id.success ? forgejoCliArgumentError("key id is required") : id
    if (parsed.data.positional.length > 1) return forgejoCliArgumentError(`user key ${split.child} accepts one id`)
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: `user-key-${split.child}`,
      id: id.data,
      yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
      ...merged.data,
      ...base,
    } as ForgejoCliInvocation)
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "title", short: "t", takesValue: true },
    { name: "force", short: "f", takesValue: false },
    { name: "read-only", short: "r", takesValue: false },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["user", "key", "upload"] })
  if (parsed.data.positional.length > 1) return forgejoCliArgumentError("user key upload accepts one key file")
  const merged = forgejoCliNestedRemote(parent.data, parsed.data)
  if (!merged.success) return merged
  return createResult({
    kind: "user-key-upload",
    keyFile: parsed.data.positional[0],
    title: forgejoCliString(parsed.data.values, "title"),
    force: forgejoCliBoolean(parsed.data.values, "force"),
    readOnly: forgejoCliBoolean(parsed.data.values, "read-only"),
    ...merged.data,
    ...base,
  })
}

function forgejoCliUserGpgParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["list", "view", "delete", "upload", "verify"], ["remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["user", "gpg"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  if (split.child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "verbose", short: "v", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "gpg", "list"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("user gpg list accepts no arguments")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "user-gpg-list",
      verbose: forgejoCliBoolean(parsed.data.values, "verbose"),
      ...merged.data,
      ...base,
    })
  }
  if (split.child === "upload") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "no-verify", short: "n", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["user", "gpg", "upload"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("user gpg upload requires a key name")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "user-gpg-upload",
      key: parsed.data.positional[0] ?? "",
      noVerify: forgejoCliBoolean(parsed.data.values, "no-verify"),
      ...merged.data,
      ...base,
    })
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "force", short: "f", takesValue: false },
    { name: "yes", short: "y", takesValue: false },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["user", "gpg", split.child] })
  const id = forgejoCliNumber(parsed.data.positional[0], "GPG key id")
  if (!id.success || id.data === undefined) return id.success ? forgejoCliArgumentError("GPG key id is required") : id
  if (parsed.data.positional.length > 1) return forgejoCliArgumentError(`user gpg ${split.child} accepts one id`)
  const merged = forgejoCliNestedRemote(parent.data, parsed.data)
  if (!merged.success) return merged
  return createResult({
    kind: `user-gpg-${split.child}`,
    id: id.data,
    force: forgejoCliBoolean(parsed.data.values, "force") || forgejoCliBoolean(parsed.data.values, "yes"),
    ...merged.data,
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliOrganizationParse(
  args: readonly string[],
  globals: { host?: string; cwd?: string; json: boolean },
  style: ForgejoCliStyle,
): ForgejoResult<ForgejoCliInvocation> {
  const [rawSubcommand, ...subcommandArgs] = args
  if (!rawSubcommand) return createResult({ kind: "help", path: ["org"] })
  const base = { host: globals.host, cwd: globals.cwd, ...forgejoCliOutputFields(globals.json, style) }
  if (rawSubcommand === "list") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      { name: "remote", short: "R", takesValue: true },
      { name: "page", short: "p", takesValue: true },
      { name: "only-member-of", short: "m", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "list"] })
    if (parsed.data.positional.length > 0) return forgejoCliArgumentError("org list accepts no positional arguments")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    if (
      forgejoCliBoolean(parsed.data.values, "only-member-of") &&
      forgejoCliString(parsed.data.values, "page") !== undefined
    )
      return forgejoCliArgumentError("--only-member-of cannot be combined with --page")
    return createResult({
      kind: "org-list",
      page: page.data ?? 1,
      onlyMemberOf: forgejoCliBoolean(parsed.data.values, "only-member-of"),
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (["view", "activity"].includes(rawSubcommand)) {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [{ name: "remote", short: "R", takesValue: true }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", rawSubcommand] })
    if (parsed.data.positional.length !== 1)
      return forgejoCliArgumentError(`org ${rawSubcommand} requires an organization`)
    return createResult({
      kind: `org-${rawSubcommand}`,
      organization: parsed.data.positional[0] ?? "",
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    } as ForgejoCliInvocation)
  }
  if (rawSubcommand === "create" || rawSubcommand === "edit")
    return forgejoCliOrganizationEditParse(rawSubcommand, subcommandArgs, base)
  if (rawSubcommand === "members") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      { name: "remote", short: "R", takesValue: true },
      { name: "page", short: "p", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "members"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("org members requires an organization")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    return createResult({
      kind: "org-members",
      organization: parsed.data.positional[0] ?? "",
      page: page.data ?? 1,
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (rawSubcommand === "visibility") {
    const parsed = forgejoCliOptionsParse(subcommandArgs, [
      { name: "remote", short: "R", takesValue: true },
      { name: "set", short: "s", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "visibility"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("org visibility requires an organization")
    const visibility = forgejoCliString(parsed.data.values, "set")
    if (visibility !== undefined && visibility !== "public" && visibility !== "private")
      return forgejoCliArgumentError("--set expects public or private")
    return createResult({
      kind: "org-visibility",
      organization: parsed.data.positional[0] ?? "",
      ...(visibility === undefined ? {} : { visibility }),
      remote: forgejoCliRemote(parsed.data.values),
      ...base,
    })
  }
  if (rawSubcommand === "team") return forgejoCliOrganizationTeamParse(subcommandArgs, base)
  if (rawSubcommand === "label") return forgejoCliOrganizationLabelParse(subcommandArgs, base)
  if (rawSubcommand === "repo") return forgejoCliOrganizationRepoParse(subcommandArgs, base)
  if (rawSubcommand === "--help" || rawSubcommand === "-h") return createResult({ kind: "help", path: ["org"] })
  return forgejoCliArgumentError(`Unknown org command '${rawSubcommand}'`)
}

function forgejoCliOrganizationEditParse(
  kind: "create" | "edit",
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const parsed = forgejoCliOptionsParse(args, [
    { name: "remote", short: "R", takesValue: true },
    { name: "full-name", short: "f", takesValue: true },
    { name: "description", short: "d", takesValue: true },
    { name: "email", short: "e", takesValue: true },
    { name: "location", short: "l", takesValue: true },
    { name: "website", short: "w", takesValue: true },
    { name: "visibility", short: "v", takesValue: true },
    { name: "admin-can-change-team-access", takesValue: false, booleanValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["org", kind] })
  if (parsed.data.positional.length !== 1) return forgejoCliArgumentError(`org ${kind} requires an organization name`)
  const visibility = forgejoCliString(parsed.data.values, "visibility")
  if (visibility !== undefined && !["private", "limited", "public"].includes(visibility))
    return forgejoCliArgumentError("--visibility expects private, limited, or public")
  const options: Record<string, unknown> = {}
  const map: Record<string, string> = {
    "full-name": "fullName",
    "admin-can-change-team-access": "adminCanChangeTeamAccess",
  }
  for (const [key, value] of Object.entries(parsed.data.values)) if (key !== "remote") options[map[key] ?? key] = value
  return createResult({
    kind: `org-${kind}`,
    organization: parsed.data.positional[0] ?? "",
    options,
    remote: forgejoCliRemote(parsed.data.values),
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliOrganizationTeamParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(
    args,
    ["list", "view", "create", "edit", "delete", "repo", "member"],
    ["remote", "R"],
  )
  if (!split.child) return createResult({ kind: "help", path: ["org", "team"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  if (["list", "view", "create", "edit", "delete"].includes(split.child)) {
    const definitions =
      split.child === "view"
        ? [{ name: "list-permissions", short: "p", takesValue: false }]
        : split.child === "delete"
          ? [
              { name: "yes", short: "y", takesValue: false },
              { name: "force", takesValue: false },
            ]
          : split.child === "create"
            ? [
                { name: "description", short: "d", takesValue: true },
                { name: "read-permissions", short: "r", takesValue: true },
                { name: "write-permissions", short: "w", takesValue: true },
                { name: "can-create-repos", short: "c", takesValue: false },
                { name: "include-all-repos", short: "i", takesValue: false },
                { name: "admin", short: "A", takesValue: false },
              ]
            : [
                { name: "new-name", short: "n", takesValue: true },
                { name: "description", short: "d", takesValue: true },
                { name: "read-permissions", short: "r", takesValue: true },
                { name: "write-permissions", short: "w", takesValue: true },
                { name: "can-create-repos", short: "c", takesValue: false, booleanValue: true },
                { name: "include-all-repos", short: "i", takesValue: false, booleanValue: true },
                { name: "admin", short: "A", takesValue: false, booleanValue: true },
              ]
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      ...definitions,
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "team", split.child] })
    const required = split.child === "list" ? 1 : split.child === "create" ? 2 : 2
    if (parsed.data.positional.length !== required)
      return forgejoCliArgumentError(`org team ${split.child} requires ${required} arguments`)
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    if (split.child === "list")
      return createResult({
        kind: "org-team-list",
        organization: parsed.data.positional[0] ?? "",
        ...merged.data,
        ...base,
      })
    if (split.child === "view")
      return createResult({
        kind: "org-team-view",
        organization: parsed.data.positional[0] ?? "",
        team: parsed.data.positional[1] ?? "",
        listPermissions: forgejoCliBoolean(parsed.data.values, "list-permissions"),
        ...merged.data,
        ...base,
      })
    if (split.child === "delete")
      return createResult({
        kind: "org-team-delete",
        organization: parsed.data.positional[0] ?? "",
        team: parsed.data.positional[1] ?? "",
        yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
        ...merged.data,
        ...base,
      })
    const options: Record<string, unknown> = {}
    const map: Record<string, string> = {
      "new-name": "newName",
      "read-permissions": "readPermissions",
      "write-permissions": "writePermissions",
      "can-create-repos": "canCreateRepos",
      "include-all-repos": "includeAllRepos",
    }
    for (const [key, value] of Object.entries(parsed.data.values))
      if (key !== "remote") options[map[key] ?? key] = value
    return createResult({
      kind: `org-team-${split.child}`,
      organization: parsed.data.positional[0] ?? "",
      team: parsed.data.positional[1] ?? "",
      options,
      ...merged.data,
      ...base,
    } as ForgejoCliInvocation)
  }
  const nested = forgejoCliNestedSplit(split.after, ["list", "add", "rm"], [])
  if (!nested.child) return createResult({ kind: "help", path: ["org", "team", split.child] })
  const nestedParent = forgejoCliOptionsParse(nested.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!nestedParent.success) return nestedParent
  const parsed = forgejoCliOptionsParse(nested.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "page", short: "p", takesValue: true },
    { name: "yes", short: "y", takesValue: false },
    { name: "force", takesValue: false },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["org", "team", split.child, nested.child] })
  const merged = forgejoCliRepositoryOptionsMerge(parent.data, nestedParent.data, parsed.data)
  if (!merged.success) return merged
  const positional = [...nestedParent.data.positional, ...parsed.data.positional]
  const needed = nested.child === "list" ? 2 : 3
  if (positional.length !== needed)
    return forgejoCliArgumentError(`org team ${split.child} ${nested.child} requires ${needed} arguments`)
  const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
  if (!page.success) return page
  const isRepo = split.child === "repo"
  return createResult({
    kind: `org-team-${isRepo ? "repo" : "member"}-${nested.child}`,
    organization: positional[0] ?? "",
    team: positional[1] ?? "",
    ...(isRepo ? { repository: positional[2] } : { user: positional[2] }),
    ...(nested.child === "list" ? { page: page.data ?? 1 } : {}),
    ...(nested.child !== "list"
      ? { yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force") }
      : {}),
    ...merged.data,
    ...base,
  } as ForgejoCliInvocation)
}

function forgejoCliOrganizationLabelParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["list", "add", "edit", "rm", "delete"], ["remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["org", "label"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  const child = split.child === "delete" ? "rm" : split.child
  if (child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [{ name: "remote", short: "R", takesValue: true }])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "label", "list"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("org label list requires an organization")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "org-label-list",
      organization: parsed.data.positional[0] ?? "",
      ...merged.data,
      ...base,
    })
  }
  if (child === "add") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "description", short: "d", takesValue: true },
      { name: "exclusive", short: "e", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "label", "add"] })
    if (parsed.data.positional.length !== 3) return forgejoCliArgumentError("org label add requires ORG NAME COLOR")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "org-label-add",
      organization: parsed.data.positional[0] ?? "",
      label: parsed.data.positional[1] ?? "",
      options: {
        color: parsed.data.positional[2],
        description: forgejoCliString(parsed.data.values, "description"),
        exclusive: forgejoCliBoolean(parsed.data.values, "exclusive"),
      },
      ...merged.data,
      ...base,
    })
  }
  if (child === "rm") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "yes", short: "y", takesValue: false },
      { name: "force", takesValue: false },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "label", "rm"] })
    if (parsed.data.positional.length !== 2) return forgejoCliArgumentError("org label rm requires ORG LABEL")
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "org-label-rm",
      organization: parsed.data.positional[0] ?? "",
      label: parsed.data.positional[1] ?? "",
      yes: forgejoCliBoolean(parsed.data.values, "yes") || forgejoCliBoolean(parsed.data.values, "force"),
      ...merged.data,
      ...base,
    })
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "new-name", short: "n", takesValue: true },
    { name: "color", short: "c", takesValue: true },
    { name: "description", short: "d", takesValue: true },
    { name: "exclusive", short: "e", takesValue: false, booleanValue: true },
    { name: "archived", short: "a", takesValue: false, booleanValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["org", "label", "edit"] })
  if (parsed.data.positional.length !== 2) return forgejoCliArgumentError("org label edit requires ORG LABEL")
  const merged = forgejoCliNestedRemote(parent.data, parsed.data)
  if (!merged.success) return merged
  const options: Record<string, unknown> = {}
  const map: Record<string, string> = { "new-name": "name" }
  for (const [key, value] of Object.entries(parsed.data.values)) if (key !== "remote") options[map[key] ?? key] = value
  return createResult({
    kind: "org-label-edit",
    organization: parsed.data.positional[0] ?? "",
    label: parsed.data.positional[1] ?? "",
    options,
    ...merged.data,
    ...base,
  })
}

function forgejoCliOrganizationRepoParse(
  args: readonly string[],
  base: ForgejoCliBaseInvocation,
): ForgejoResult<ForgejoCliInvocation> {
  const split = forgejoCliNestedSplit(args, ["list", "create"], ["remote", "R"])
  if (!split.child) return createResult({ kind: "help", path: ["org", "repo"] })
  const parent = forgejoCliOptionsParse(split.before, [{ name: "remote", short: "R", takesValue: true }])
  if (!parent.success) return parent
  const remote = forgejoCliRemote(parent.data.values)
  if (split.child === "list") {
    const parsed = forgejoCliOptionsParse(split.after, [
      { name: "remote", short: "R", takesValue: true },
      { name: "page", short: "p", takesValue: true },
    ])
    if (!parsed.success) return parsed
    if (parsed.data.help) return createResult({ kind: "help", path: ["org", "repo", "list"] })
    if (parsed.data.positional.length !== 1) return forgejoCliArgumentError("org repo list requires an organization")
    const page = forgejoCliNumber(forgejoCliString(parsed.data.values, "page"), "--page")
    if (!page.success) return page
    const merged = forgejoCliNestedRemote(parent.data, parsed.data)
    if (!merged.success) return merged
    return createResult({
      kind: "org-repo-list",
      organization: parsed.data.positional[0] ?? "",
      page: page.data ?? 1,
      ...merged.data,
      ...base,
    })
  }
  const parsed = forgejoCliOptionsParse(split.after, [
    { name: "remote", short: "R", takesValue: true },
    { name: "description", short: "d", takesValue: true },
    { name: "private", short: "P", takesValue: false },
    { name: "auto-init", takesValue: false },
    { name: "default-branch", takesValue: true },
    { name: "readme", takesValue: true },
  ])
  if (!parsed.success) return parsed
  if (parsed.data.help) return createResult({ kind: "help", path: ["org", "repo", "create"] })
  if (parsed.data.positional.length !== 2) return forgejoCliArgumentError("org repo create requires ORG NAME")
  const merged = forgejoCliNestedRemote(parent.data, parsed.data)
  if (!merged.success) return merged
  const options: Record<string, unknown> = {
    description: forgejoCliString(parsed.data.values, "description"),
    private: forgejoCliBoolean(parsed.data.values, "private"),
    autoInit: forgejoCliBoolean(parsed.data.values, "auto-init"),
    defaultBranch: forgejoCliString(parsed.data.values, "default-branch"),
    readme: forgejoCliString(parsed.data.values, "readme"),
  }
  return createResult({
    kind: "org-repo-create",
    organization: parsed.data.positional[0] ?? "",
    name: parsed.data.positional[1] ?? "",
    options,
    ...merged.data,
    ...base,
  })
}

export type { ForgejoCliInvocation }
