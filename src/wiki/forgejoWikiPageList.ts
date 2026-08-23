import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoWikiContentsGet } from "./forgejoWikiContentsGet.js"
import type { ForgejoWikiPage } from "./forgejoWikiPageSchema.js"

export function forgejoWikiPageList(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<ForgejoWikiPage[]>> {
  return forgejoWikiContentsGet(transport, repositoryInput)
}
