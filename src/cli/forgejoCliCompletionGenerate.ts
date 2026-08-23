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

function forgejoCliCompletionCommandList(command: ForgejoCliCommand): string[] {
  return Object.keys(command.commands ?? {})
}

function forgejoCliCompletionOptionList(
  command: ForgejoCliCommand,
  ancestors: readonly ForgejoCliCommand[] = [],
): string[] {
  const options = new Map<string, string[]>()
  for (const current of [...ancestors, command]) {
    for (const option of current.options ?? []) {
      options.set(option.name, [`--${option.name}`, ...(option.short ? [`-${option.short}`] : [])])
    }
  }
  options.set("help", ["--help", "-h"])
  return [...options.values()].flat()
}

function forgejoCliCompletionOptionValues(
  command: ForgejoCliCommand,
  ancestors: readonly ForgejoCliCommand[] = [],
): string[] {
  return [
    ...new Set(
      [...ancestors, command].flatMap((current) =>
        (current.options ?? []).flatMap((option) => (option.values ? [...option.values] : [])),
      ),
    ),
  ]
}

function forgejoCliCompletionOptionsJoin(...optionLists: readonly string[][]): string {
  return [...new Set(optionLists.flat())].join(" ")
}

function forgejoCliCompletionBashNestedCases(
  command: ForgejoCliCommand,
  depth: number,
  ancestors: readonly ForgejoCliCommand[],
): string {
  return Object.entries(command.commands ?? {})
    .map(([name, child]) => {
      const commands = forgejoCliCompletionCommandList(child).join(" ")
      const options = forgejoCliCompletionOptionList(child, [...ancestors, command]).join(" ")
      const candidates = [commands, options].filter((value) => value.length > 0).join(" ")
      const nested =
        Object.keys(child.commands ?? {}).length === 0
          ? ""
          : `
        case "\${COMP_WORDS[${depth + 1}]}" in
${forgejoCliCompletionBashNestedCases(child, depth + 1, [...ancestors, command])}
        esac`
      return `      ${name})
        candidates="${candidates}"
${nested}
        ;;`
    })
    .join("\n")
}

function forgejoCliCompletionBash(binName: string): string {
  const root = forgejoCliCompletionCommandList(forgejoCliCommandHierarchy).join(" ")
  const globalOptions = forgejoCliCompletionOptionList(forgejoCliCommandHierarchy).join(" ")
  const nestedCases = forgejoCliCompletionBashNestedCases(forgejoCliCommandHierarchy, 1, [])
  return `# bash completion for ${binName}
_${binName.replace(/[^A-Za-z0-9_]/g, "_")}_complete() {
  local current="\${COMP_WORDS[COMP_CWORD]}"
  local previous="\${COMP_WORDS[COMP_CWORD-1]}"
  local candidates="${root} ${globalOptions}"
  case "\${COMP_WORDS[1]}" in
${nestedCases}
  esac
  if [[ "\${previous}" == "--style" ]]; then
    candidates="fancy minimal"
  elif [[ "\${current}" == --style=* ]]; then
    candidates="--style=fancy --style=minimal"
  fi
  COMPREPLY=($(compgen -W "\${candidates}" -- "\${current}"))
}
complete -F _${binName.replace(/[^A-Za-z0-9_]/g, "_")}_complete ${binName}
`
}

function forgejoCliCompletionZshNestedCases(
  command: ForgejoCliCommand,
  depth: number,
  ancestors: readonly ForgejoCliCommand[],
): string {
  return Object.entries(command.commands ?? {})
    .map(([name, child]) => {
      const commands = forgejoCliCompletionCommandList(child).join(" ")
      const options = forgejoCliCompletionOptionList(child, [...ancestors, command]).join(" ")
      const nested =
        Object.keys(child.commands ?? {}).length === 0
          ? ""
          : `
      case "\${words[${depth + 1}]}" in
${forgejoCliCompletionZshNestedCases(child, depth + 1, [...ancestors, command])}
      esac`
      return `    ${name})
      commands=(${commands})
      options=(${options})
${nested}
      ;;`
    })
    .join("\n")
}

function forgejoCliCompletionZsh(binName: string): string {
  const root = forgejoCliCompletionCommandList(forgejoCliCommandHierarchy).join(" ")
  const globalOptions = forgejoCliCompletionOptionList(forgejoCliCommandHierarchy).join(" ")
  const nestedCases = forgejoCliCompletionZshNestedCases(forgejoCliCommandHierarchy, 2, [])
  return `#compdef ${binName}

_${binName.replace(/[^A-Za-z0-9_]/g, "_")}() {
  local -a commands options
  commands=(${root})
  options=(${globalOptions})
  case "\${words[2]}" in
${nestedCases}
  esac
  _arguments \\
    '1:command:->command' \\
    '*:argument:->argument'
  case $state in
    command) _describe 'command' commands ;;
    argument) _values 'option' \${options} ;;
  esac
}

_${binName.replace(/[^A-Za-z0-9_]/g, "_")} "$@"
`
}

function forgejoCliCompletionFishOptionLines(
  binName: string,
  command: ForgejoCliCommand,
  ancestors: readonly ForgejoCliCommand[],
  condition: string,
): string[] {
  const options = [...ancestors, command].flatMap((current) => current.options ?? [])
  const unique = new Map(options.map((option) => [option.name, option]))
  return [...unique.values()].flatMap((option) => {
    const short = option.short ? ` -s ${option.short}` : ""
    const values = option.values ? ` -a '${option.values.join(" ")}'` : ""
    return [`complete -c ${binName} -f -n '${condition}' -l ${option.name}${short}${values}`]
  })
}

function forgejoCliCompletionFishNestedLines(
  binName: string,
  command: ForgejoCliCommand,
  ancestors: readonly ForgejoCliCommand[],
  path: readonly string[],
): string[] {
  const condition =
    path.length === 0
      ? "__fish_use_subcommand"
      : path.map((name) => `__fish_seen_subcommand_from ${name}`).join("; and ")
  const lines = forgejoCliCompletionFishOptionLines(binName, command, ancestors, condition)
  const commands = forgejoCliCompletionCommandList(command)
  if (commands.length > 0) lines.push(`complete -c ${binName} -f -n '${condition}' -a '${commands.join(" ")}'`)
  for (const [name, child] of Object.entries(command.commands ?? {}))
    lines.push(...forgejoCliCompletionFishNestedLines(binName, child, [...ancestors, command], [...path, name]))
  return lines
}

function forgejoCliCompletionFish(binName: string): string {
  const lines = [
    `# fish completion for ${binName}`,
    ...forgejoCliCompletionFishNestedLines(binName, forgejoCliCommandHierarchy, [], []),
    `complete -c ${binName} -f -n '__fish_seen_subcommand_from completion' -a 'bash zsh fish powershell'`,
  ]
  return `${lines.join("\n")}\n`
}

function forgejoCliCompletionPowerShellQuote(value: string): string {
  return `"${value.replaceAll('"', '``"')}"`
}

function forgejoCliCompletionPowerShellPaths(
  command: ForgejoCliCommand,
  path: readonly string[] = [],
  ancestors: readonly ForgejoCliCommand[] = [],
): string[] {
  const candidates = [
    ...forgejoCliCompletionCommandList(command),
    ...forgejoCliCompletionOptionList(command, ancestors),
    ...forgejoCliCompletionOptionValues(command, ancestors),
  ]
  const caseLine = `  "${path.join(" ")}" { $candidates = @(${[...new Set(candidates)]
    .map(forgejoCliCompletionPowerShellQuote)
    .join(", ")}); break }`
  return [
    caseLine,
    ...Object.entries(command.commands ?? {}).flatMap(([name, child]) =>
      forgejoCliCompletionPowerShellPaths(child, [...path, name], [...ancestors, command]),
    ),
  ]
}

function forgejoCliCompletionPowerShell(binName: string): string {
  const root = [
    ...forgejoCliCompletionCommandList(forgejoCliCommandHierarchy),
    ...forgejoCliCompletionOptionList(forgejoCliCommandHierarchy),
    ...forgejoCliCompletionOptionValues(forgejoCliCommandHierarchy),
  ]
  const values = [...new Set(root)].map(forgejoCliCompletionPowerShellQuote).join(", ")
  const paths = forgejoCliCompletionPowerShellPaths(forgejoCliCommandHierarchy).join("\n")
  return `Register-ArgumentCompleter -CommandName '${binName.replaceAll("'", "''")}' -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $candidates = @(${values})
  $elements = @($commandAst.CommandElements | Select-Object -Skip 1 | ForEach-Object { $_.Value })
  $path = ($elements | Where-Object { $_ -notlike '-*' }) -join ' '
  switch ($path) {
${paths}
  }
  $candidates |
    Where-Object { $_ -like "$wordToComplete*" } |
    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
}
`
}

export function forgejoCliCompletionGenerate(shell: string, binName: string): string {
  if (shell === "bash") return forgejoCliCompletionBash(binName)
  if (shell === "zsh") return forgejoCliCompletionZsh(binName)
  if (shell === "fish") return forgejoCliCompletionFish(binName)
  return forgejoCliCompletionPowerShell(binName)
}
