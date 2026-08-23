import { createResult } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import type { ForgejoUser } from "./forgejoUserSchema.js"
import { forgejoUserSearchPage } from "./forgejoUserSearchPage.js"

export async function forgejoUserSearch(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser[]>> {
  const page = await forgejoUserSearchPage(transport, input)
  if (!page.success) return page
  return createResult(page.data.users)
}
