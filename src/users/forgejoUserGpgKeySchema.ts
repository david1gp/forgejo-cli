import * as a from "valibot"

const forgejoUserGpgKeyEmailSchema = a.looseObject({
  email: a.optional(a.nullable(a.string())),
  verified: a.optional(a.nullable(a.boolean())),
})

const forgejoUserGpgKeySchema = a.looseObject({
  id: a.optional(a.nullable(a.number())),
  key_id: a.optional(a.nullable(a.string())),
  primary_key_id: a.optional(a.nullable(a.string())),
  public_key: a.optional(a.nullable(a.string())),
  emails: a.optional(a.nullable(a.array(forgejoUserGpgKeyEmailSchema))),
  can_sign: a.optional(a.nullable(a.boolean())),
  can_encrypt_comms: a.optional(a.nullable(a.boolean())),
  can_encrypt_storage: a.optional(a.nullable(a.boolean())),
  can_certify: a.optional(a.nullable(a.boolean())),
  verified: a.optional(a.nullable(a.boolean())),
  subkeys: a.optional(a.nullable(a.array(a.unknown()))),
})

export { forgejoUserGpgKeySchema }
export type ForgejoUserGpgKey = a.InferOutput<typeof forgejoUserGpgKeySchema>
