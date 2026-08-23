import * as a from "valibot"

const forgejoActionTaskSchema = a.looseObject({
  created_at: a.optional(a.nullable(a.string())),
  display_title: a.optional(a.nullable(a.string())),
  event: a.optional(a.nullable(a.string())),
  head_branch: a.optional(a.nullable(a.string())),
  head_sha: a.optional(a.nullable(a.string())),
  id: a.optional(a.nullable(a.number())),
  name: a.optional(a.nullable(a.string())),
  run_number: a.optional(a.nullable(a.number())),
  run_started_at: a.optional(a.nullable(a.string())),
  status: a.optional(a.nullable(a.string())),
  updated_at: a.optional(a.nullable(a.string())),
  url: a.optional(a.nullable(a.string())),
  workflow_id: a.optional(a.nullable(a.string())),
})

export { forgejoActionTaskSchema }
export type ForgejoActionTask = a.InferOutput<typeof forgejoActionTaskSchema>
