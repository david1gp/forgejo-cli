import { createResult, createResultError } from "#result"
import * as a from "valibot"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import {
  forgejoUserActivityListOptionsSchema,
  type ForgejoUserActivityListOptions,
} from "./forgejoUserActivityListOptionsSchema.js"
import { forgejoUserActivitySchema, type ForgejoUserActivity } from "./forgejoUserActivitySchema.js"
import { forgejoUserCurrentGet } from "../forgejoUserCurrentGet.js"
import { forgejoUserReferenceParse } from "../forgejoUserReferenceParse.js"

export async function forgejoUserActivityList(
  transport: ForgejoRestTransport,
  userInput?: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoUserActivity[]>> {
  const op = "forgejoUserActivityList"
  const parsed = a.safeParse(forgejoUserActivityListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoUserActivityListOptions = parsed.output
  let user: string | undefined
  if (userInput === undefined) {
    const current = await forgejoUserCurrentGet(transport)
    if (!current.success) return current
    user = current.data.login ?? current.data.username ?? undefined
    if (!user) return createResultError(op, "Current user does not have a username")
  } else {
    const parsedUser = forgejoUserReferenceParse(userInput)
    if (!parsedUser.success) return createResultError(op, parsedUser.errorMessage)
    user = parsedUser.data
  }
  const response = await transport.request({
    path: `/api/v1/users/${encodeURIComponent(user)}/activities`,
    query: {
      ...(options.onlyPerformedBy === undefined ? {} : { only_performed_by: options.onlyPerformedBy }),
      ...(options.date === undefined ? {} : { date: options.date }),
      ...(options.page === undefined ? {} : { page: options.page }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    },
  })
  if (!response.success) return response
  const activities = a.safeParse(a.array(forgejoUserActivitySchema), response.data.data)
  if (!activities.success) return createResultError(op, a.summarize(activities.issues))
  return createResult(activities.output)
}
