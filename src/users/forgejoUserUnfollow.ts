import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserReferenceParse } from "./forgejoUserReferenceParse.js"

export async function forgejoUserUnfollow(
  transport: ForgejoRestTransport,
  userInput: unknown,
): Promise<ForgejoResult<null>> {
  const op = "forgejoUserUnfollow"
  const user = forgejoUserReferenceParse(userInput)
  if (!user.success) return createResultError(op, user.errorMessage)
  const response = await transport.request<null>({
    path: `/api/v1/user/following/${encodeURIComponent(user.data)}`,
    method: "DELETE",
    responseType: "empty",
  })
  if (!response.success) return response
  return createResult(response.data.data)
}
