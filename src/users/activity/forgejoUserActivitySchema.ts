import * as a from "valibot"

const forgejoUserActivitySchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  user_id: a.optional(a.nullable(a.number())),
  op_type: a.optional(a.nullable(a.string())),
  act_user: a.optional(a.nullable(a.unknown())),
  repo: a.optional(a.nullable(a.unknown())),
  content: a.optional(a.nullable(a.string())),
  ref_name: a.optional(a.nullable(a.string())),
  is_private: a.optional(a.nullable(a.boolean())),
  created: a.optional(a.nullable(a.string())),
})

export { forgejoUserActivitySchema }
export type ForgejoUserActivity = a.InferOutput<typeof forgejoUserActivitySchema>
