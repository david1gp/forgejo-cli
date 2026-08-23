import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"

function forgejoPullRequestPathCreate(repository: ForgejoRepositoryIdentifier, number?: number): string {
  const path = `${forgejoRepositoryPathCreate(repository)}/pulls`
  return number === undefined ? path : `${path}/${encodeURIComponent(String(number))}`
}

export { forgejoPullRequestPathCreate }
