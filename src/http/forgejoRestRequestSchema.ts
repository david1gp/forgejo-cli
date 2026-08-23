import * as a from "valibot"

const forgejoQueryValueSchema = a.union([
  a.string(),
  a.number(),
  a.boolean(),
  a.null(),
  a.array(a.union([a.string(), a.number(), a.boolean(), a.null()])),
])

const forgejoRestRequestSchema = a.object({
  path: a.pipe(
    a.string(),
    a.trim(),
    a.minLength(1),
    a.check((input) => !/^[a-z][a-z\d+.-]*:/i.test(input), "Forgejo REST paths must be relative"),
    a.check((input) => !input.startsWith("//"), "Forgejo REST paths must be relative"),
  ),
  method: a.optional(
    a.pipe(
      a.string(),
      a.trim(),
      a.minLength(1),
      a.transform((input) => input.toUpperCase()),
    ),
    "GET",
  ),
  query: a.optional(a.record(a.string(), forgejoQueryValueSchema)),
  headers: a.optional(a.record(a.string(), a.string())),
  body: a.optional(a.unknown()),
  responseType: a.optional(a.picklist(["json", "text", "binary", "empty"] as const), "json"),
})

export { forgejoRestRequestSchema }
export type ForgejoRestRequestInput = a.InferInput<typeof forgejoRestRequestSchema>
export type ForgejoRestRequest = a.InferOutput<typeof forgejoRestRequestSchema>
