import { spawn } from "node:child_process"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"

export async function forgejoCliBrowserOpen(url: string): Promise<ForgejoResult<null>> {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  return await new Promise((resolve) => {
    let settled = false
    const child = spawn(command, args, { detached: true, stdio: "ignore" })
    child.once("error", () => {
      if (settled) return
      settled = true
      resolve(createResultError("forgejoCliBrowserOpen", "Unable to open the browser"))
    })
    child.once("spawn", () => {
      if (settled) return
      settled = true
      child.unref()
      resolve(createResult(null))
    })
  })
}
