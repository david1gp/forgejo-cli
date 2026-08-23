import { forgejoRepositoryPathCreate } from "../repositories/forgejoRepositoryPathCreate.js"
import type { ForgejoRepositoryIdentifier } from "../repositories/forgejoRepositoryIdentifierSchema.js"

function forgejoIssuePathCreate(repository: ForgejoRepositoryIdentifier, number?: number): string {
  const path = `${forgejoRepositoryPathCreate(repository)}/issues`
  return number === undefined ? path : `${path}/${encodeURIComponent(String(number))}`
}

export { forgejoIssuePathCreate }
