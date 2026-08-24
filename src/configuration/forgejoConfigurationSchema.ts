import * as a from "valibot"
import { forgejoHostSchema } from "../hosts/forgejoHostSchema.js"
import { forgejoApplicationTokenSchema } from "../credentials/forgejoApplicationTokenSchema.js"
import { forgejoOAuthCredentialSchema } from "../credentials/forgejoOAuthCredentialSchema.js"

const forgejoConfigurationDefaultStringSchema = a.pipe(a.string(), a.trim(), a.minLength(1))

const forgejoConfigurationSchema = a.looseObject({
  hosts: a.record(forgejoHostSchema, a.union([forgejoApplicationTokenSchema, forgejoOAuthCredentialSchema])),
  oauth_client_ids: a.optional(a.record(forgejoHostSchema, a.pipe(a.string(), a.trim(), a.minLength(1)))),
  // These fields mirror the persisted key metadata used by the Rust CLI. They
  // remain optional so existing configuration files retain their shape.
  aliases: a.optional(a.record(forgejoHostSchema, forgejoHostSchema)),
  default_ssh: a.optional(a.array(forgejoHostSchema)),
  default_host: a.optional(forgejoHostSchema),
  ssh_base: a.optional(forgejoConfigurationDefaultStringSchema),
  default_org: a.optional(forgejoConfigurationDefaultStringSchema),
  default_remote: a.optional(forgejoConfigurationDefaultStringSchema),
})

export { forgejoConfigurationSchema }
export type ForgejoConfiguration = a.InferOutput<typeof forgejoConfigurationSchema>
