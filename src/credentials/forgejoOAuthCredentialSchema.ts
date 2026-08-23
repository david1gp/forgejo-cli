import * as a from "valibot"

const forgejoOAuthCredentialSchema = a.looseObject({
  type: a.literal("OAuth"),
  token: a.pipe(a.string(), a.trim(), a.minLength(1)),
  refresh_token: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
  expires_at: a.optional(a.pipe(a.string(), a.trim(), a.minLength(1))),
})

export { forgejoOAuthCredentialSchema }
export type ForgejoOAuthCredential = a.InferOutput<typeof forgejoOAuthCredentialSchema>
