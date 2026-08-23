import { createResult, createResultError, resultTryParsingFetchErr } from "#result"
import * as a from "valibot"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import {
  forgejoApplicationTokenSchema,
  type ForgejoApplicationToken,
} from "../credentials/forgejoApplicationTokenSchema.js"
import { forgejoPaginationParse, type ForgejoPagination } from "./forgejoPaginationParse.js"
import {
  forgejoRestRequestSchema,
  type ForgejoRestRequest,
  type ForgejoRestRequestInput,
} from "./forgejoRestRequestSchema.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"

type ForgejoFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

type ForgejoRestTransportOptions = {
  baseUrl: string
  token?: unknown
  fetch?: ForgejoFetch
}

type ForgejoRestResponse<T> = {
  data: T | null
  status: number
  statusText: string
  headers: Record<string, string>
  pagination?: ForgejoPagination
}

type ForgejoRestTransport = {
  request<T = unknown>(request: ForgejoRestRequestInput): Promise<ForgejoResult<ForgejoRestResponse<T>>>
}

function forgejoRestUrlCreate(baseUrl: string, path: string, query: ForgejoRestRequest["query"]): ForgejoResult<URL> {
  const op = "forgejoRestTransportRequest"
  let url: URL
  try {
    url = new URL(path.replace(/^\/+/, ""), baseUrl)
  } catch {
    return createResultError(op, "Forgejo REST path is not a valid URL")
  }
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const values = Array.isArray(value) ? value : [value]
      for (const item of values) {
        if (item !== null) url.searchParams.append(key, String(item))
      }
    }
  }
  return createResult(url)
}

function forgejoRestErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "forgejo.bad-request",
    401: "forgejo.unauthorized",
    403: "forgejo.forbidden",
    404: "forgejo.not-found",
    409: "forgejo.conflict",
    429: "forgejo.rate-limited",
    500: "forgejo.server-error",
    503: "forgejo.unavailable",
  }
  return codes[status] ?? "platform.internal"
}

function forgejoRestErrorMessage(body: string, statusText: string): string {
  try {
    const parsed: unknown = JSON.parse(body)
    if (typeof parsed === "object" && parsed !== null) {
      if ("message" in parsed && typeof parsed.message === "string") return parsed.message
      if ("errorMessage" in parsed && typeof parsed.errorMessage === "string") return parsed.errorMessage
      if ("error" in parsed && typeof parsed.error === "string") return parsed.error
      if ("error" in parsed && typeof parsed.error === "object" && parsed.error !== null && "message" in parsed.error) {
        if (typeof parsed.error.message === "string") return parsed.error.message
      }
      if ("errors" in parsed && Array.isArray(parsed.errors)) {
        const messages = parsed.errors.filter((error): error is string => typeof error === "string")
        if (messages.length > 0) return messages.join(", ")
      }
    }
  } catch {
    // A plain-text Forgejo error is handled below.
  }
  return body.trim() || statusText || "Forgejo API request failed"
}

function forgejoRestHeadersCreate(request: ForgejoRestRequest, token: ForgejoApplicationToken | undefined): Headers {
  const headers = new Headers(request.headers)
  if (token) headers.set("Authorization", `token ${token}`)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  const rawBody =
    typeof request.body === "string" ||
    request.body instanceof Blob ||
    request.body instanceof URLSearchParams ||
    request.body instanceof ArrayBuffer ||
    ArrayBuffer.isView(request.body)
  if (request.body !== undefined && !rawBody && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")
  return headers
}

type ForgejoRestBody = string | Blob | URLSearchParams | ArrayBuffer | ArrayBufferView

function forgejoRestBodyCreate(body: unknown): ForgejoResult<ForgejoRestBody | undefined> {
  const op = "forgejoRestTransportRequest"
  if (body === undefined) return createResult(undefined)
  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return createResult(body)
  }
  try {
    const serialized = JSON.stringify(body)
    if (serialized === undefined) return createResultError(op, "Forgejo REST request body cannot be serialized as JSON")
    return createResult(serialized)
  } catch {
    return createResultError(op, "Forgejo REST request body cannot be serialized as JSON")
  }
}

async function forgejoRestResponseCreate<T>(
  response: Response,
  responseType: ForgejoRestRequest["responseType"],
): Promise<ForgejoResult<ForgejoRestResponse<T>>> {
  const op = "forgejoRestTransportRequest"
  const headers = Object.fromEntries(response.headers.entries())
  const pagination = forgejoPaginationParse(response.headers)
  if (!pagination.success) return pagination
  if (responseType === "binary") {
    let binary: ArrayBuffer
    try {
      binary = await response.arrayBuffer()
    } catch {
      return createResultError(op, "Unable to read Forgejo API response")
    }
    if (!response.ok) {
      const body = new TextDecoder().decode(binary)
      const parsedError = resultTryParsingFetchErr(op, body, response.status, response.statusText)
      return {
        ...parsedError,
        code: forgejoRestErrorCode(response.status),
        errorMessage: forgejoRestErrorMessage(body, response.statusText),
      }
    }
    return createResult({
      data: new Uint8Array(binary),
      status: response.status,
      statusText: response.statusText,
      headers,
      ...(pagination.data ? { pagination: pagination.data } : {}),
    }) as ForgejoResult<ForgejoRestResponse<T>>
  }
  let body: string
  try {
    body = await response.text()
  } catch {
    return createResultError(op, "Unable to read Forgejo API response")
  }

  if (!response.ok) {
    const parsedError = resultTryParsingFetchErr(op, body, response.status, response.statusText)
    return {
      ...parsedError,
      code: forgejoRestErrorCode(response.status),
      errorMessage: forgejoRestErrorMessage(body, response.statusText),
    }
  }
  if (responseType === "empty" || body.length === 0 || response.status === 204 || response.status === 205) {
    return createResult({
      data: null,
      status: response.status,
      statusText: response.statusText,
      headers,
      ...(pagination.data ? { pagination: pagination.data } : {}),
    })
  }
  let data: T | string
  if (responseType === "text") {
    data = body
  } else {
    try {
      data = JSON.parse(body) as T
    } catch {
      return createResultError(op, "Forgejo API returned invalid JSON")
    }
  }
  return createResult({
    data: data as T,
    status: response.status,
    statusText: response.statusText,
    headers,
    ...(pagination.data ? { pagination: pagination.data } : {}),
  })
}

export function forgejoRestTransportCreate(options: ForgejoRestTransportOptions): ForgejoResult<ForgejoRestTransport> {
  const op = "forgejoRestTransportCreate"
  const baseUrl = forgejoBaseUrlParse(options.baseUrl)
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
  let token: ForgejoApplicationToken | undefined
  if (options.token !== undefined) {
    const parsedToken = a.safeParse(forgejoApplicationTokenSchema, options.token)
    if (!parsedToken.success) return createResultError(op, "Forgejo application token must be a non-empty string")
    token = parsedToken.output
  }
  const fetcher = options.fetch ?? globalThis.fetch?.bind(globalThis)
  if (!fetcher) return createResultError(op, "A fetch implementation is required")

  const request = async <T = unknown>(
    input: ForgejoRestRequestInput,
  ): Promise<ForgejoResult<ForgejoRestResponse<T>>> => {
    const parsedRequest = a.safeParse(forgejoRestRequestSchema, input)
    if (!parsedRequest.success)
      return createResultError("forgejoRestTransportRequest", a.summarize(parsedRequest.issues))
    const url = forgejoRestUrlCreate(baseUrl.data, parsedRequest.output.path, parsedRequest.output.query)
    if (!url.success) return url
    const body = forgejoRestBodyCreate(parsedRequest.output.body)
    if (!body.success) return body
    const headers = forgejoRestHeadersCreate(parsedRequest.output, token)
    let response: Response
    try {
      response = await fetcher(url.data, {
        method: parsedRequest.output.method,
        headers,
        body: body.data as RequestInit["body"],
      })
    } catch {
      return createResultError("forgejoRestTransportRequest", "Unable to reach Forgejo API")
    }
    return forgejoRestResponseCreate<T>(response, parsedRequest.output.responseType)
  }
  return createResult({ request })
}

export type {
  ForgejoFetch,
  ForgejoRestRequest,
  ForgejoRestRequestInput,
  ForgejoRestResponse,
  ForgejoRestTransport,
  ForgejoRestTransportOptions,
}
