import * as a from "valibot"

const forgejoUserGpgKeyVerifyOptionsSchema = a.object({
  keyId: a.pipe(a.string(), a.trim(), a.minLength(1)),
  armoredSignature: a.pipe(a.string(), a.trim(), a.minLength(1)),
})

export { forgejoUserGpgKeyVerifyOptionsSchema }
export type ForgejoUserGpgKeyVerifyOptions = a.InferOutput<typeof forgejoUserGpgKeyVerifyOptionsSchema>
