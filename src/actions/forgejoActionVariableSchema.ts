import * as a from "valibot"

const forgejoActionVariableSchema = a.looseObject({
  data: a.optional(a.nullable(a.string())),
  name: a.optional(a.nullable(a.string())),
  owner_id: a.optional(a.nullable(a.number())),
  repo_id: a.optional(a.nullable(a.number())),
})

export { forgejoActionVariableSchema }
export type ForgejoActionVariable = a.InferOutput<typeof forgejoActionVariableSchema>
