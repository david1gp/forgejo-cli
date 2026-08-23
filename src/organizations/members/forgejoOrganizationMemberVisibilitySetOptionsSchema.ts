import * as a from "valibot"

const forgejoOrganizationMemberVisibilitySetOptionsSchema = a.object({
  visibility: a.picklist(["public", "private"] as const),
})

export { forgejoOrganizationMemberVisibilitySetOptionsSchema }
export type ForgejoOrganizationMemberVisibilitySetOptions = a.InferOutput<
  typeof forgejoOrganizationMemberVisibilitySetOptionsSchema
>
