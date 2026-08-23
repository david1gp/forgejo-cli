import * as a from "valibot"

const forgejoOAuthTokenSchema = a.looseObject({
  access_token: a.pipe(a.string(), a.trim(), a.minLength(1)),
  token_type: a.optional(a.string()),
  expires_in: a.optional(a.number()),
  refresh_token: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
})

export { forgejoOAuthTokenSchema }
export type ForgejoOAuthToken = a.InferOutput<typeof forgejoOAuthTokenSchema>
