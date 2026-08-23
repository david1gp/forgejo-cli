import { forgejoCliCommandHierarchy } from "./forgejoCliCommandHierarchy.js"

type ForgejoCliCommand = {
  description: string
  options?: readonly {
    name: string
    short?: string
    value?: string
    description: string
    values?: readonly string[]
  }[]
  commands?: Record<string, ForgejoCliCommand>
}

function forgejoCliCommandFind(path: readonly string[]): ForgejoCliCommand | undefined {
  let command: ForgejoCliCommand = forgejoCliCommandHierarchy
  for (const segment of path) {
    const next = command.commands?.[segment]
    if (!next) return undefined
    command = next
  }
  return command
}

function forgejoCliCommandOptionsFind(path: readonly string[]): NonNullable<ForgejoCliCommand["options"]> {
  let command: ForgejoCliCommand = forgejoCliCommandHierarchy
  const commands = [command]
  for (const segment of path) {
    const next = command.commands?.[segment]
    if (!next) break
    command = next
    commands.push(command)
  }
  const options = new Map<string, NonNullable<ForgejoCliCommand["options"]>[number]>()
  for (const current of commands) {
    for (const option of current.options ?? []) options.set(option.name, option)
  }
  return [...options.values()]
}

function forgejoCliOptionFormat(option: {
  name: string
  short?: string
  value?: string
  description: string
  values?: readonly string[]
}): string {
  const short = option.short ? `-${option.short}, ` : "    "
  const value = option.value ? ` <${option.value}>` : ""
  const values = option.values ? ` (${option.values.join(" | ")})` : ""
  return `  ${short}--${option.name}${value}${values}`
}

export function forgejoCliHelpRender(path: readonly string[] = []): string {
  const command = forgejoCliCommandFind(path) ?? forgejoCliCommandHierarchy
  const commandPath = [forgejoCliCommandHierarchyName(), ...path].join(" ")
  const usage = command.commands ? `Usage: ${commandPath} [OPTIONS] <COMMAND>` : `Usage: ${commandPath} [OPTIONS]`
  const sections = [usage, "", command.description]

  const options = [...forgejoCliCommandOptionsFind(path)]
  options.push({ name: "help", short: "h", description: "Print help information." })
  if (options.length > 0) {
    sections.push("", "Options:")
    for (const option of options) sections.push(`${forgejoCliOptionFormat(option)}\n      ${option.description}`)
  }

  const commands = command.commands ? Object.entries(command.commands) : []
  if (commands.length > 0) {
    sections.push("", "Commands:")
    for (const [name, child] of commands) sections.push(`  ${name.padEnd(14)} ${child.description}`)
  }

  return `${sections.join("\n")}\n`
}

function forgejoCliCommandHierarchyName(): string {
  return "fj"
}
