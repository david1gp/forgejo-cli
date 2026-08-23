import * as a from "valibot"

const forgejoWikiPageSchema = a.looseObject({
  commit_count: a.optional(a.nullable(a.number())),
  content_base64: a.optional(a.nullable(a.string())),
  footer: a.optional(a.nullable(a.string())),
  html_url: a.optional(a.nullable(a.string())),
  last_commit: a.optional(a.nullable(a.unknown())),
  name: a.optional(a.nullable(a.string())),
  sidebar: a.optional(a.nullable(a.string())),
  sub_url: a.optional(a.nullable(a.string())),
  title: a.optional(a.nullable(a.string())),
})

export { forgejoWikiPageSchema }
export type ForgejoWikiPage = a.InferOutput<typeof forgejoWikiPageSchema>
