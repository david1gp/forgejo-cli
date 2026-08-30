import * as a from "valibot"

const forgejoDirectoryAssignmentSchema = a.union([a.pipe(a.string(), a.trim(), a.minLength(1)), a.null()])

type ForgejoDirectoryAssignment = a.InferOutput<typeof forgejoDirectoryAssignmentSchema>
type ForgejoDirectoryAssignments = Record<string, ForgejoDirectoryAssignment>

export { forgejoDirectoryAssignmentSchema }
export type { ForgejoDirectoryAssignment, ForgejoDirectoryAssignments }
