import { isAbsolute, normalize, relative, resolve, sep } from "node:path"
import type { ForgejoDirectoryAssignment, ForgejoDirectoryAssignments } from "./forgejoDirectoryAssignmentSchema.js"

type ForgejoDirectoryAssignmentMatch = {
  path: string
  assignment: ForgejoDirectoryAssignment
}

type ForgejoDirectoryAssignmentMatchResolveOptions = {
  assignments?: ForgejoDirectoryAssignments
  cwd?: string
}

function forgejoDirectoryAssignmentPathIsAncestor(ancestor: string, cwd: string): boolean {
  const relativePath = relative(ancestor, cwd)
  return (
    relativePath === "" || (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  )
}

export function forgejoDirectoryAssignmentMatchResolve(
  options: ForgejoDirectoryAssignmentMatchResolveOptions = {},
): ForgejoDirectoryAssignmentMatch | undefined {
  const cwd = resolve(options.cwd ?? process.cwd())
  const matches = Object.entries(options.assignments ?? {})
    .filter(([path]) => isAbsolute(path))
    .map(([path, assignment]) => ({ path: normalize(path), assignment }))
    .filter(({ path }) => forgejoDirectoryAssignmentPathIsAncestor(path, cwd))
    .sort((left, right) => right.path.length - left.path.length)
  return matches[0]
}

export type { ForgejoDirectoryAssignmentMatch, ForgejoDirectoryAssignmentMatchResolveOptions }
