import { createServer } from "node:http"
import { timingSafeEqual } from "node:crypto"
import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"

const forgejoOAuthLoopbackDefaultPath = "/oauth/callback"
const forgejoOAuthLoopbackDefaultTimeoutMs = 120_000
const forgejoOAuthLoopbackStringSchema = a.pipe(a.string(), a.trim(), a.minLength(1))
const forgejoOAuthLoopbackPortSchema = a.pipe(a.number(), a.integer(), a.minValue(0), a.maxValue(65_535))
const forgejoOAuthLoopbackTimeoutSchema = a.pipe(a.number(), a.integer(), a.minValue(1))
const forgejoOAuthLoopbackPathSchema = a.pipe(a.string(), a.trim(), a.regex(/^\/[^?#]*$/))

type ForgejoOAuthLoopbackReceiverRequest = {
  method?: string
  url?: string
}

type ForgejoOAuthLoopbackReceiverResponse = {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: string): void
}

type ForgejoOAuthLoopbackReceiverServerAddress = {
  address: string
  port: number
}

type ForgejoOAuthLoopbackReceiverServer = {
  on(event: "error", listener: (error: Error) => void): void
  listen(options: { host: string; port: number }, callback: () => void): void
  address(): ForgejoOAuthLoopbackReceiverServerAddress | string | null
  close(callback: (error?: Error) => void): void
}

type ForgejoOAuthLoopbackReceiverServerCreate = (
  handler: (request: ForgejoOAuthLoopbackReceiverRequest, response: ForgejoOAuthLoopbackReceiverResponse) => void,
) => ForgejoOAuthLoopbackReceiverServer

type ForgejoOAuthLoopbackReceiverCreateOptions = {
  expectedState: unknown
  path?: unknown
  port?: unknown
  timeoutMs?: unknown
  serverCreate?: ForgejoOAuthLoopbackReceiverServerCreate
}

type ForgejoOAuthLoopbackReceiver = {
  redirectUri: string
  wait(): Promise<ForgejoResult<string>>
  close(): Promise<void>
}

function forgejoOAuthLoopbackReceiverServerCreate(
  handler: (request: ForgejoOAuthLoopbackReceiverRequest, response: ForgejoOAuthLoopbackReceiverResponse) => void,
): ForgejoOAuthLoopbackReceiverServer {
  const server = createServer((request, response) => handler(request, response))
  return {
    on(event, listener) {
      server.on(event, listener)
    },
    listen(options, callback) {
      server.listen(options, callback)
    },
    address() {
      const address = server.address()
      if (address === null || typeof address === "string") return address
      return { address: address.address, port: address.port }
    },
    close(callback) {
      server.close(callback)
    },
  }
}

function forgejoOAuthLoopbackReceiverResponseSend(
  response: ForgejoOAuthLoopbackReceiverResponse,
  statusCode: number,
  body: string,
): void {
  try {
    response.statusCode = statusCode
    response.setHeader("Content-Type", "text/html; charset=utf-8")
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Content-Length", String(Buffer.byteLength(body)))
    response.end(body)
  } catch {
    // The receiver result remains authoritative when a client disconnects early.
  }
}

function forgejoOAuthLoopbackReceiverStateMatches(expectedState: string, receivedState: string): boolean {
  const expected = Buffer.from(expectedState, "utf8")
  const received = Buffer.from(receivedState, "utf8")
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

function forgejoOAuthLoopbackReceiverErrorResponse(
  response: ForgejoOAuthLoopbackReceiverResponse,
  statusCode = 400,
): void {
  forgejoOAuthLoopbackReceiverResponseSend(
    response,
    statusCode,
    "<!doctype html><title>Forgejo sign-in</title><p>Authentication failed. You may close this window.</p>",
  )
}

function forgejoOAuthLoopbackReceiverSuccessResponse(response: ForgejoOAuthLoopbackReceiverResponse): void {
  forgejoOAuthLoopbackReceiverResponseSend(
    response,
    200,
    "<!doctype html><title>Forgejo sign-in</title><p>Authentication complete. You may close this window.</p>",
  )
}

/**
 * Starts a loopback-only OAuth callback receiver without opening a browser or exchanging credentials.
 *
 * The receiver uses an ephemeral port by default. Call `wait()` after starting the authorization flow;
 * it resolves once with the validated authorization code or a safe OAuth callback error.
 */
async function forgejoOAuthLoopbackReceiverCreate(
  options: ForgejoOAuthLoopbackReceiverCreateOptions,
): Promise<ForgejoResult<ForgejoOAuthLoopbackReceiver>> {
  const op = "forgejoOAuthLoopbackReceiverCreate"
  const expectedState = a.safeParse(forgejoOAuthLoopbackStringSchema, options.expectedState)
  if (!expectedState.success) return createResultError(op, "OAuth expected state must be a non-empty string")

  const path =
    options.path === undefined
      ? forgejoOAuthLoopbackDefaultPath
      : a.safeParse(forgejoOAuthLoopbackPathSchema, options.path)
  if (typeof path !== "string" && !path.success) return createResultError(op, "OAuth callback path is invalid")
  const pathValue = typeof path === "string" ? path : path.output
  if (pathValue.includes("\\")) return createResultError(op, "OAuth callback path is invalid")

  const port = options.port === undefined ? 0 : a.safeParse(forgejoOAuthLoopbackPortSchema, options.port)
  if (typeof port !== "number" && !port.success)
    return createResultError(op, "OAuth callback port must be an integer between 0 and 65535")
  const portValue = typeof port === "number" ? port : port.output

  const timeoutMs =
    options.timeoutMs === undefined
      ? forgejoOAuthLoopbackDefaultTimeoutMs
      : a.safeParse(forgejoOAuthLoopbackTimeoutSchema, options.timeoutMs)
  if (typeof timeoutMs !== "number" && !timeoutMs.success)
    return createResultError(op, "OAuth callback timeout must be a positive integer")
  const timeoutValue = typeof timeoutMs === "number" ? timeoutMs : timeoutMs.output
  const serverCreate = options.serverCreate ?? forgejoOAuthLoopbackReceiverServerCreate

  return await new Promise((resolve) => {
    let server: ForgejoOAuthLoopbackReceiverServer | undefined
    let started = false
    let startupSettled = false
    let settled = false
    let startupTimer: ReturnType<typeof setTimeout> | undefined
    let callbackTimer: ReturnType<typeof setTimeout> | undefined
    let closePromise: Promise<void> | undefined
    let waitResolve: (result: ForgejoResult<string>) => void = () => undefined
    const waitResult = new Promise<ForgejoResult<string>>((resolveWait) => {
      waitResolve = resolveWait
    })

    const closeServer = (): Promise<void> => {
      if (closePromise) return closePromise
      closePromise = new Promise((resolveClose) => {
        if (!server) {
          resolveClose()
          return
        }
        try {
          server.close(() => resolveClose())
        } catch {
          resolveClose()
        }
      })
      return closePromise
    }

    const startupFail = (message: string): void => {
      if (startupSettled) return
      startupSettled = true
      if (startupTimer) clearTimeout(startupTimer)
      void closeServer().then(() => resolve(createResultError(op, message)))
    }

    const finish = (result: ForgejoResult<string>, response?: ForgejoOAuthLoopbackReceiverResponse): void => {
      if (settled) return
      settled = true
      if (callbackTimer) clearTimeout(callbackTimer)
      if (result.success) {
        if (response) forgejoOAuthLoopbackReceiverSuccessResponse(response)
      } else if (response) {
        forgejoOAuthLoopbackReceiverErrorResponse(response)
      }
      void closeServer().then(() => waitResolve(result))
    }

    const callbackHandle = (
      request: ForgejoOAuthLoopbackReceiverRequest,
      response: ForgejoOAuthLoopbackReceiverResponse,
    ): void => {
      if (settled) {
        forgejoOAuthLoopbackReceiverErrorResponse(response, 410)
        return
      }
      if (request.method !== "GET") {
        forgejoOAuthLoopbackReceiverErrorResponse(response, 405)
        return
      }
      if (!request.url?.startsWith("/") || request.url.startsWith("//")) {
        finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback URL is invalid"), response)
        return
      }

      let callbackUrl: URL
      try {
        callbackUrl = new URL(request.url, "http://127.0.0.1")
      } catch {
        finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback URL is invalid"), response)
        return
      }
      if (callbackUrl.pathname !== pathValue) {
        forgejoOAuthLoopbackReceiverErrorResponse(response, 404)
        return
      }

      if (callbackUrl.searchParams.has("error")) {
        finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth provider returned an error"), response)
        return
      }
      const stateValues = callbackUrl.searchParams.getAll("state")
      const stateValue = stateValues[0]
      if (stateValues.length !== 1 || stateValue === undefined || stateValue.length === 0) {
        finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback is missing state"), response)
        return
      }
      if (!forgejoOAuthLoopbackReceiverStateMatches(expectedState.output, stateValue)) {
        finish(
          createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback state does not match expected state"),
          response,
        )
        return
      }

      const codeValues = callbackUrl.searchParams.getAll("code")
      const codeValue = codeValues[0]
      if (codeValues.length !== 1 || codeValue === undefined || codeValue.trim().length === 0) {
        finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback is missing code"), response)
        return
      }
      finish(createResult(codeValue), response)
    }

    const serverErrorHandle = (error: Error): void => {
      if (!started) {
        startupFail("Unable to bind OAuth callback receiver")
        return
      }
      finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback receiver failed"))
      void error
    }

    try {
      const boundServer = serverCreate(callbackHandle)
      server = boundServer
      boundServer.on("error", serverErrorHandle)
      startupTimer = setTimeout(() => startupFail("OAuth callback receiver timed out while starting"), timeoutValue)
      boundServer.listen({ host: "127.0.0.1", port: portValue }, () => {
        if (startupSettled) return
        const address = boundServer.address()
        if (
          address === null ||
          typeof address === "string" ||
          address.address !== "127.0.0.1" ||
          !Number.isInteger(address.port) ||
          address.port < 1 ||
          address.port > 65_535
        ) {
          startupFail("OAuth callback receiver did not bind to 127.0.0.1")
          return
        }
        started = true
        startupSettled = true
        if (startupTimer) clearTimeout(startupTimer)
        callbackTimer = setTimeout(
          () => finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback receiver timed out")),
          timeoutValue,
        )
        const redirectUri = `http://127.0.0.1:${address.port}${pathValue}`
        const receiver: ForgejoOAuthLoopbackReceiver = {
          redirectUri,
          wait: () => waitResult,
          close: async () => {
            finish(createResultError("forgejoOAuthLoopbackReceiverWait", "OAuth callback receiver closed"))
            await closeServer()
          },
        }
        resolve(createResult(receiver))
      })
    } catch {
      startupFail("Unable to bind OAuth callback receiver")
    }
  })
}

export {
  forgejoOAuthLoopbackReceiverCreate,
  type ForgejoOAuthLoopbackReceiver,
  type ForgejoOAuthLoopbackReceiverCreateOptions,
  type ForgejoOAuthLoopbackReceiverRequest,
  type ForgejoOAuthLoopbackReceiverResponse,
  type ForgejoOAuthLoopbackReceiverServer,
  type ForgejoOAuthLoopbackReceiverServerAddress,
  type ForgejoOAuthLoopbackReceiverServerCreate,
}
