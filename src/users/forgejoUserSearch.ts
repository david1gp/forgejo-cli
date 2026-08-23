import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoUserSearchOptionsSchema, type ForgejoUserSearchOptions } from "./forgejoUserSearchOptionsSchema.js"
import { forgejoUserSchema, type ForgejoUser } from "./forgejoUserSchema.js"

export async function forgejoUserSearch(
  transport: ForgejoRestTransport,
  input: unknown,
): Promise<ForgejoResult<ForgejoUser[]>> {
  const op = "forgejoUserSearch"
  const parsed = a.safeParse(forgejoUserSearchOptionsSchema, typeof input === "string" ? { query: input } : input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserSearchOptions = parsed.output
  const query = options.query ?? options.q
  if (!query) return createResultError(op, "A user search query is required")
  const response = await transport.request({
    path: "/api/v1/users/search",
    query: {
      q: query,
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
      ...(options.sort === undefined ? {} : { sort: options.sort }),
      ...(options.order === undefined ? {} : { order: options.order }),
    },
  })
  if (!response.success) return response
  const data = response.data.data
  const usersInput = typeof data === "object" && data !== null && "data" in data ? data.data : data
  const users = a.safeParse(a.array(forgejoUserSchema), usersInput)
  if (!users.success) return createResultError(op, a.summarize(users.issues))
  return createResult(users.output)
}
