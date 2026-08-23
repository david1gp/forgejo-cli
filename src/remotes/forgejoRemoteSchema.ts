import * as a from "valibot"
import { forgejoBaseUrlSchema } from "../hosts/forgejoBaseUrlSchema.js"
import { forgejoRepositoryIdentifierSchema } from "../repositories/forgejoRepositoryIdentifierSchema.js"

const forgejoRemoteProtocolSchema = a.picklist(["http", "https", "ssh"] as const)
const forgejoRemoteUrlSchema = a.pipe(
  a.string(),
  a.url(),
  a.check((input) => /^(?:https?|ssh):\/\//i.test(input), "Remote must use HTTP, HTTPS, or SSH"),
  a.check((input) => !/[?#]/.test(input), "Remote cannot contain a query or fragment"),
  a.check((input) => !/^https?:\/\/[^/]*@/i.test(input), "Remote cannot contain credentials"),
)

const forgejoRemoteSchema = a.object({
  url: forgejoRemoteUrlSchema,
  baseUrl: forgejoBaseUrlSchema,
  repository: forgejoRepositoryIdentifierSchema,
  protocol: forgejoRemoteProtocolSchema,
})

export { forgejoRemoteSchema }
export type ForgejoRemote = a.InferOutput<typeof forgejoRemoteSchema>
