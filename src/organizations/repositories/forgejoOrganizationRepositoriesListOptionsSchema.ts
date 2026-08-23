import * as a from "valibot"

const forgejoOrganizationRepositoriesListOptionsSchema = a.object({
  page: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  limit: a.optional(a.pipe(a.number(), a.integer(), a.minValue(1))),
  sort: a.optional(a.string()),
  order: a.optional(a.picklist(["asc", "desc"] as const)),
  private: a.optional(a.boolean()),
})

export { forgejoOrganizationRepositoriesListOptionsSchema }
export type ForgejoOrganizationRepositoriesListOptions = a.InferOutput<
  typeof forgejoOrganizationRepositoriesListOptionsSchema
>
