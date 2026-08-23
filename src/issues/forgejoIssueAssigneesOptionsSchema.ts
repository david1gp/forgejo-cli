import * as a from "valibot"

const forgejoIssueAssigneesOptionsSchema = a.object({
  users: a.pipe(a.array(a.pipe(a.string(), a.trim(), a.minLength(1))), a.minLength(1)),
})

export { forgejoIssueAssigneesOptionsSchema }
export type ForgejoIssueAssigneesOptions = a.InferOutput<typeof forgejoIssueAssigneesOptionsSchema>
