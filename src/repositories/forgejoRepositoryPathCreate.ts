import type { ForgejoRepositoryIdentifier } from "./forgejoRepositoryIdentifierSchema.js"

export function forgejoRepositoryPathCreate(repository: ForgejoRepositoryIdentifier): string {
  return `/api/v1/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`
}
