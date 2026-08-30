import type { ForgejoDirectoryAssignments } from "./forgejoDirectoryAssignmentSchema.js"
import { forgejoDirectoryAssignmentMatchResolve } from "./forgejoDirectoryAssignmentMatchResolve.js"

type ForgejoDirectoryAssignmentResolution =
  | { organization: string; noOrg?: never }
  | { noOrg: true; organization?: never }

type ForgejoDirectoryAssignmentResolveOptions = {
  assignments?: ForgejoDirectoryAssignments
  cwd?: string
}

export function forgejoDirectoryAssignmentResolve(
  options: ForgejoDirectoryAssignmentResolveOptions = {},
): ForgejoDirectoryAssignmentResolution | undefined {
  const match = forgejoDirectoryAssignmentMatchResolve(options)
  if (!match) return undefined
  if (match.assignment === null) return { noOrg: true }
  return { organization: match.assignment }
}

export type { ForgejoDirectoryAssignmentResolution, ForgejoDirectoryAssignmentResolveOptions }
