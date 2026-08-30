import * as a from "valibot"
import { forgejoHostSchema } from "../hosts/forgejoHostSchema.js"
import { forgejoApplicationTokenSchema } from "../credentials/forgejoApplicationTokenSchema.js"
import { forgejoOAuthCredentialSchema } from "../credentials/forgejoOAuthCredentialSchema.js"
import { forgejoDirectoryAssignmentSchema } from "./forgejoDirectoryAssignmentSchema.js"
import { isAbsolute } from "node:path"

const forgejoConfigurationDefaultStringSchema = a.pipe(a.string(), a.trim(), a.minLength(1))
const forgejoConfigurationAbsolutePathSchema = a.pipe(
  a.string(),
  a.check((input) => isAbsolute(input), "Forgejo directory assignment paths must be absolute"),
)

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
  directory_assignments: a.optional(a.record(forgejoConfigurationAbsolutePathSchema, forgejoDirectoryAssignmentSchema)),
})

export { forgejoConfigurationSchema }
export type ForgejoConfiguration = a.InferOutput<typeof forgejoConfigurationSchema>
