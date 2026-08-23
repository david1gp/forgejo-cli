import * as a from "valibot"

const forgejoActionRunSchema = a.looseObject({
  ScheduleID: a.optional(a.nullable(a.number())),
  approved_by: a.optional(a.nullable(a.number())),
  commit_sha: a.optional(a.nullable(a.string())),
  created: a.optional(a.nullable(a.string())),
  duration: a.optional(a.nullable(a.number())),
  event: a.optional(a.nullable(a.string())),
  event_payload: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
  id: a.optional(a.nullable(a.number())),
  index_in_repo: a.optional(a.nullable(a.number())),
  is_fork_pull_request: a.optional(a.nullable(a.boolean())),
  is_ref_deleted: a.optional(a.nullable(a.boolean())),
  need_approval: a.optional(a.nullable(a.boolean())),
  prettyref: a.optional(a.nullable(a.string())),
  repository: a.optional(a.nullable(a.unknown())),
  started: a.optional(a.nullable(a.string())),
  status: a.optional(a.nullable(a.string())),
  stopped: a.optional(a.nullable(a.string())),
  title: a.optional(a.nullable(a.string())),
  trigger_event: a.optional(a.nullable(a.string())),
  trigger_user: a.optional(a.nullable(a.unknown())),
  updated: a.optional(a.nullable(a.string())),
  workflow_id: a.optional(a.nullable(a.string())),
})

export { forgejoActionRunSchema }
export type ForgejoActionRun = a.InferOutput<typeof forgejoActionRunSchema>
