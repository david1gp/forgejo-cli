import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"
import type { ForgejoFetch } from "../http/forgejoRestTransportCreate.js"
import { forgejoOAuthTokenSchema, type ForgejoOAuthToken } from "./forgejoOAuthTokenSchema.js"

type ForgejoOAuthAuthorizationCodePkceExchangeOptions = {
  baseUrl: unknown
  clientId: unknown
  redirectUri: unknown
  code: unknown
  codeVerifier: unknown
  fetch?: ForgejoFetch
}

const forgejoOAuthExchangeStringSchema = a.pipe(a.string(), a.trim(), a.minLength(1))
const forgejoOAuthCodeVerifierSchema = a.pipe(
  a.string(),
  a.minLength(43),
  a.maxLength(128),
  a.regex(/^[A-Za-z0-9._~-]+$/),
)

/**
 * Exchanges an authorization code without browser or listener side effects.
 * The caller owns the redirect handling and must provide the OAuth app's
 * clientId; this package intentionally has no unsafe host-specific default.
 */
export async function forgejoOAuthAuthorizationCodePkceExchange(
  options: ForgejoOAuthAuthorizationCodePkceExchangeOptions,
): Promise<ForgejoResult<ForgejoOAuthToken>> {
  const op = "forgejoOAuthAuthorizationCodePkceExchange"
  const baseUrl = forgejoBaseUrlParse(options.baseUrl)
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
  const clientId = a.safeParse(forgejoOAuthExchangeStringSchema, options.clientId)
  if (!clientId.success) return createResultError(op, "OAuth clientId must be a non-empty string")
  const redirectUri = a.safeParse(forgejoOAuthExchangeStringSchema, options.redirectUri)
  if (!redirectUri.success) return createResultError(op, "OAuth redirectUri must be a non-empty string")
  const code = a.safeParse(forgejoOAuthExchangeStringSchema, options.code)
  if (!code.success) return createResultError(op, "OAuth code must be a non-empty string")
  const codeVerifier = a.safeParse(forgejoOAuthCodeVerifierSchema, options.codeVerifier)
  if (!codeVerifier.success) return createResultError(op, "OAuth codeVerifier must be a valid PKCE verifier")
  const fetcher = options.fetch ?? globalThis.fetch?.bind(globalThis)
  if (!fetcher) return createResultError(op, "A fetch implementation is required")

  const tokenUrl = new URL("login/oauth/access_token", baseUrl.data)
  const body = new URLSearchParams({
    client_id: clientId.output,
    code: code.output,
    code_verifier: codeVerifier.output,
    redirect_uri: redirectUri.output,
    grant_type: "authorization_code",
  })
  let response: Response
  try {
    response = await fetcher(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
  } catch {
    return createResultError(op, "Unable to reach Forgejo OAuth endpoint")
  }
  let text: string
  try {
    text = await response.text()
  } catch {
    return createResultError(op, "Unable to read Forgejo OAuth response")
  }
  if (!response.ok)
    return createResultError(op, text.trim() || `Forgejo OAuth request failed with status ${response.status}`)

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return createResultError(op, "Forgejo OAuth endpoint returned invalid JSON")
  }
  const token = a.safeParse(forgejoOAuthTokenSchema, data)
  if (!token.success) return createResultError(op, a.summarize(token.issues))
  return createResult(token.output)
}

export type { ForgejoOAuthAuthorizationCodePkceExchangeOptions }
