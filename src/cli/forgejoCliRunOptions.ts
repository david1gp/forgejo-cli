import type { ForgejoFetch } from "../http/forgejoRestTransportCreate.js"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoProcessExecute } from "../repositories/forgejoRepositoryContextResolve.js"
import type {
  ForgejoOAuthLoopbackReceiver,
  ForgejoOAuthLoopbackReceiverCreateOptions,
} from "../auth/forgejoOAuthLoopbackReceiverCreate.js"

type ForgejoCliRunOptions = {
  env?: Record<string, string | undefined>
  fetch?: ForgejoFetch
  execute?: ForgejoProcessExecute
  browserOpen?: (url: string) => Promise<ForgejoResult<null>>
  oauthLoopbackReceiverCreate?: (
    options: ForgejoOAuthLoopbackReceiverCreateOptions,
  ) => Promise<ForgejoResult<ForgejoOAuthLoopbackReceiver>>
  editor?: (initial: string, extension?: string) => Promise<ForgejoResult<string>>
  stdinRead?: () => Promise<ForgejoResult<string>>
  fileRead?: (path: string, encoding: "utf8" | "binary") => Promise<ForgejoResult<string | Uint8Array>>
  directoryRead?: (path: string) => Promise<ForgejoResult<string[]>>
  fileWrite?: (path: string, data: Uint8Array, options?: { exclusive?: boolean }) => Promise<ForgejoResult<null>>
  confirm?: (message: string) => Promise<boolean>
  sleep?: (milliseconds: number) => Promise<void>
  outputWrite?: (output: string) => ForgejoResult<null>
  promptWrite?: (output: string) => ForgejoResult<null>
  stderrWrite?: (output: string) => ForgejoResult<null>
  stdoutIsTty?: boolean
}

export type { ForgejoCliRunOptions }
