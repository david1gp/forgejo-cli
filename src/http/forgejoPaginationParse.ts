import { createResult } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"

type ForgejoPagination = {
  first?: string
  prev?: string
  next?: string
  last?: string
  totalCount?: number
}

function forgejoPaginationLinkParse(value: string): Partial<ForgejoPagination> {
  const pagination: Partial<ForgejoPagination> = {}
  for (const part of value.split(/,\s*(?=<)/)) {
    const match = part.match(/^\s*<([^>]+)>\s*;\s*rel\s*=\s*"?([^";\s]+)"?/i)
    if (!match) continue
    const relation = match[2]?.toLowerCase()
    if (relation === "first" || relation === "prev" || relation === "next" || relation === "last") {
      pagination[relation] = match[1]
    }
  }
  return pagination
}

export function forgejoPaginationParse(headers: Headers): ForgejoResult<ForgejoPagination | undefined> {
  const pagination: ForgejoPagination = {}
  const link = headers.get("link")
  if (link) Object.assign(pagination, forgejoPaginationLinkParse(link))
  const totalCount = headers.get("x-total-count")
  if (totalCount !== null && /^\d+$/.test(totalCount)) pagination.totalCount = Number(totalCount)
  if (Object.keys(pagination).length === 0) return createResult(undefined)
  return createResult(pagination)
}

export type { ForgejoPagination }
