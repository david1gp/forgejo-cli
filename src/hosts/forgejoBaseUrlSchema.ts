import * as a from "valibot"

const forgejoBaseUrlSchema = a.pipe(
  a.string(),
  a.url(),
  a.check((input) => /^https?:\/\//i.test(input), "Forgejo base URL must use HTTP or HTTPS"),
  a.check((input) => !/[?#]/.test(input), "Forgejo base URL cannot contain a query or fragment"),
  a.check((input) => !/^https?:\/\/[^/]*@/i.test(input), "Forgejo base URL cannot contain credentials"),
)

export { forgejoBaseUrlSchema }
export type ForgejoBaseUrl = a.InferOutput<typeof forgejoBaseUrlSchema>
