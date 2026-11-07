import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"

export async function forgejoUserTokenDelete(
  transport: ForgejoRestTransport,
  userInput: unknown,
  idInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoUserTokenDelete"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const id = a.safeParse(a.pipe(a.number(), a.integer(), a.minValue(1)), idInput)
  if (!id.success) return createResultError(op, a.summarize(id.issues))
  const response = await transport.request<null>({
    path: `/api/v1/users/${encodeURIComponent(user.data)}/tokens/${id.output}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
