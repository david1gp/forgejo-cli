import * as a from "valibot"

const forgejoUserGpgKeyUploadOptionsSchema = a.object({
  armoredPublicKey: a.pipe(a.string(), a.trim(), a.minLength(1)),
  armoredSignature: a.optional(a.nullable(a.string())),
})

export { forgejoUserGpgKeyUploadOptionsSchema }
export type ForgejoUserGpgKeyUploadOptions = a.InferOutput<typeof forgejoUserGpgKeyUploadOptionsSchema>
