import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"

export async function forgejoUserGpgKeyDelete(
  transport: ForgejoRestTransport,
  idInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoUserGpgKeyDelete"
  const id = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1)), idInput)
  if (!id.success) return createResultError(op, a.summarize(id.issues))
  const response = await transport.request<null>({
    path: `/api/v1/user/gpg_keys/${id.output}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
