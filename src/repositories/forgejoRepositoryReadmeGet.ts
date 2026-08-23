import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoRestTransport } from "../http/forgejoRestTransportCreate.js"
import { forgejoRepositoryPathCreate } from "./forgejoRepositoryPathCreate.js"
import { forgejoRepositoryReferenceParse } from "./forgejoRepositoryReferenceParse.js"

const forgejoRepositoryContentSchema = a.looseObject({
  name: a.optional(a.nullable(a.string())),
  path: a.optional(a.nullable(a.string())),
  type: a.optional(a.nullable(a.string())),
})

export async function forgejoRepositoryReadmeGet(
  transport: ForgejoRestTransport,
  repositoryInput: unknown,
): Promise<ForgejoResult<string>> {
  const op = "forgejoRepositoryReadmeGet"
  const repository = forgejoRepositoryReferenceParse(repositoryInput)
  if (!repository.success) return createResultError(op, repository.errorMessage)
  const filesResponse = await transport.request({ path: `${forgejoRepositoryPathCreate(repository.data)}/contents` })
  if (!filesResponse.success) return filesResponse
  const files = a.safeParse(a.array(forgejoRepositoryContentSchema), filesResponse.data.data)
  if (!files.success) return createResultError(op, a.summarize(files.issues))
  const readme = files.output.find(
    (file) => file.type === "file" && typeof file.name === "string" && /^readme(?:\.[^.]+)?$/i.test(file.name),
  )
  if (!readme) return createResultError(op, "Repository does not contain a README")
  const path = readme.path ?? readme.name
  if (!path) return createResultError(op, "Repository README has no path")
  const encodedPath = path.split("/").map(encodeURIComponent).join("/")
  const response = await transport.request({
    path: `${forgejoRepositoryPathCreate(repository.data)}/raw/${encodedPath}`,
    responseType: "text",
  })
  if (!response.success) return response
  if (typeof response.data.data !== "string") return createResultError(op, "Repository README response is not text")
  return createResult(response.data.data)
}
