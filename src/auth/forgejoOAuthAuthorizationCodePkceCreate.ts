import { randomBytes, createHash } from "node:crypto"
import * as a from "valibot"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import { forgejoBaseUrlParse } from "../hosts/forgejoBaseUrlParse.js"

const forgejoOAuthNonEmptyStringSchema = a.pipe(a.string(), a.trim(), a.minLength(1))
const forgejoOAuthCodeVerifierSchema = a.pipe(
  a.string(),
  a.minLength(43),
  a.maxLength(128),
  a.regex(/^[A-Za-z0-9._~-]+$/),
)
const forgejoOAuthAuthorizationCodePkceOptionsSchema = a.object({
  baseUrl: a.unknown(),
  clientId: a.unknown(),
  redirectUri: a.unknown(),
  scope: a.optional(a.unknown()),
  state: a.optional(a.unknown()),
  codeVerifier: a.optional(a.unknown()),
})

type ForgejoOAuthAuthorizationCodePkceCreateOptions = {
  baseUrl: unknown
  clientId: unknown
  redirectUri: unknown
  scope?: unknown
  state?: unknown
  codeVerifier?: unknown
}

type ForgejoOAuthAuthorizationCodePkce = {
  authorizationUrl: string
  state: string
  codeVerifier: string
  codeChallenge: string
}

function forgejoOAuthRandomValue(): string {
  return randomBytes(32).toString("base64url")
}

/**
 * Builds, but does not open, a Forgejo OAuth authorization URL.
 *
 * Forgejo installations have different OAuth applications, so `clientId` is
 * deliberately required and no host-specific client ID is bundled here.
 */
export function forgejoOAuthAuthorizationCodePkceCreate(
  options: ForgejoOAuthAuthorizationCodePkceCreateOptions,
): ForgejoResult<ForgejoOAuthAuthorizationCodePkce> {
  const op = "forgejoOAuthAuthorizationCodePkceCreate"
  const input = a.safeParse(forgejoOAuthAuthorizationCodePkceOptionsSchema, options)
  if (!input.success) return createResultError(op, a.summarize(input.issues))
  const baseUrl = forgejoBaseUrlParse(input.output.baseUrl)
  if (!baseUrl.success) return createResultError(op, baseUrl.errorMessage)
  const clientId = a.safeParse(forgejoOAuthNonEmptyStringSchema, input.output.clientId)
  if (!clientId.success) return createResultError(op, "OAuth clientId must be a non-empty string")
  const redirectUri = a.safeParse(forgejoOAuthNonEmptyStringSchema, input.output.redirectUri)
  if (!redirectUri.success) return createResultError(op, "OAuth redirectUri must be a non-empty string")
  try {
    new URL(redirectUri.output)
  } catch {
    return createResultError(op, "OAuth redirectUri must be a valid URL")
  }

  const state =
    input.output.state === undefined
      ? forgejoOAuthRandomValue()
      : a.safeParse(forgejoOAuthNonEmptyStringSchema, input.output.state)
  if (typeof state !== "string" && !state.success)
    return createResultError(op, "OAuth state must be a non-empty string")
  const codeVerifier =
    input.output.codeVerifier === undefined
      ? forgejoOAuthRandomValue()
      : a.safeParse(forgejoOAuthCodeVerifierSchema, input.output.codeVerifier)
  if (typeof codeVerifier !== "string" && !codeVerifier.success)
    return createResultError(op, "OAuth codeVerifier must be a valid PKCE verifier")

  const stateValue = typeof state === "string" ? state : state.output
  const codeVerifierValue = typeof codeVerifier === "string" ? codeVerifier : codeVerifier.output
  const codeChallenge = createHash("sha256").update(codeVerifierValue).digest("base64url")
  const authorizationUrl = new URL("login/oauth/authorize", baseUrl.data)
  authorizationUrl.searchParams.set("client_id", clientId.output)
  authorizationUrl.searchParams.set("redirect_uri", redirectUri.output)
  authorizationUrl.searchParams.set("response_type", "code")
  authorizationUrl.searchParams.set("code_challenge_method", "S256")
  authorizationUrl.searchParams.set("code_challenge", codeChallenge)
  authorizationUrl.searchParams.set("state", stateValue)
  if (input.output.scope !== undefined) {
    const scope = a.safeParse(forgejoOAuthNonEmptyStringSchema, input.output.scope)
    if (!scope.success) return createResultError(op, "OAuth scope must be a non-empty string")
    authorizationUrl.searchParams.set("scope", scope.output)
  }
  return createResult({
    authorizationUrl: authorizationUrl.toString(),
    state: stateValue,
    codeVerifier: codeVerifierValue,
    codeChallenge,
  })
}

export type { ForgejoOAuthAuthorizationCodePkce, ForgejoOAuthAuthorizationCodePkceCreateOptions }
