import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../../http/forgejoRestTransportCreate.js"
import { forgejoPullRequestPathCreate } from "../forgejoPullRequestPathCreate.js"
import { forgejoPullRequestReferenceResolve } from "../forgejoPullRequestReferenceResolve.js"
import { forgejoPullRequestFileSchema, type ForgejoPullRequestFile } from "./forgejoPullRequestFileSchema.js"
import {
  forgejoPullRequestFilesListOptionsSchema,
  type ForgejoPullRequestFilesListOptions,
} from "./forgejoPullRequestFilesListOptionsSchema.js"

export async function forgejoPullRequestFilesList(
  transport: ForgejoRestTransport,
  pullRequestInput: unknown,
  optionsInput: unknown = {},
): Promise<ForgejoResult<ForgejoPullRequestFile[]>> {
  const op = "forgejoPullRequestFilesList"
  const reference = await forgejoPullRequestReferenceResolve(transport, pullRequestInput)
  if (!reference.success) return createResultError(op, reference.errorMessage)
  const parsed = a.safeParse(forgejoPullRequestFilesListOptionsSchema, optionsInput)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const options: ForgejoPullRequestFilesListOptions = parsed.output
  const files: ForgejoPullRequestFile[] = []
  let page = options.page

  while (true) {
    const response = await transport.request({
      path: `${forgejoPullRequestPathCreate(reference.data.repository, reference.data.pullRequest.number)}/files`,
      query: {
        ...(options.all === true || page !== undefined ? { page: page ?? 1 } : {}),
        ...(options.all === true || options.limit !== undefined ? { limit: options.limit ?? 50 } : {}),
      },
    })
    if (!response.success) return response
    const parsedFiles = a.safeParse(a.array(forgejoPullRequestFileSchema), response.data.data)
    if (!parsedFiles.success) return createResultError(op, a.summarize(parsedFiles.issues))
    files.push(...parsedFiles.output)
    const currentPage = page ?? 1
    const pageLimit = options.limit ?? 50
    const moreByCount =
      response.data.pagination?.totalCount !== undefined &&
      currentPage * pageLimit < response.data.pagination.totalCount
    if (options.all !== true || (response.data.pagination?.next === undefined && !moreByCount)) break
    page = (page ?? 1) + 1
  }

  return createResult(files)
}
