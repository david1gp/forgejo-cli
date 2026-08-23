import * as a from "valibot"

const forgejoRepositoryPartSchema = a.pipe(a.string(), a.minLength(1), a.regex(/^[^/\s?#]+$/))
const forgejoRepositoryHostSchema = a.pipe(a.string(), a.minLength(1), a.regex(/^\S+$/))

const forgejoRepositoryIdentifierSchema = a.object({
  host: a.optional(forgejoRepositoryHostSchema),
  owner: forgejoRepositoryPartSchema,
  name: forgejoRepositoryPartSchema,
})

export { forgejoRepositoryIdentifierSchema }
export type ForgejoRepositoryIdentifier = a.InferOutput<typeof forgejoRepositoryIdentifierSchema>
