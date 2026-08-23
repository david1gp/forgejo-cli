import { execFile as nodeExecFile, spawn } from "node:child_process"
import { promisify } from "node:util"
import { createResult, createResultError } from "#result"
import type { ForgejoResult } from "../errors/forgejoResult.js"
import type { ForgejoProcessCommand } from "../repositories/forgejoRepositoryContextResolve.js"

const forgejoCliExecFile = promisify(nodeExecFile)

export async function forgejoCliProcessExecute(input: ForgejoProcessCommand) {
  if (input.stdin !== undefined) {
    return await new Promise<ForgejoResult<string>>((resolve) => {
      const child = spawn(input.command, [...input.args], { cwd: input.cwd, stdio: ["pipe", "pipe", "ignore"] })
      const chunks: Buffer[] = []
      child.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
      child.once("error", () =>
        resolve(createResultError("forgejoCliProcessExecute", `Command failed: ${input.command}`)),
      )
      child.once("close", (code) => {
        if (code !== 0) {
          resolve(createResultError("forgejoCliProcessExecute", `Command failed: ${input.command}`))
          return
        }
        resolve(createResult(Buffer.concat(chunks).toString("utf8")))
      })
      child.stdin.end(input.stdin)
    })
  }
  try {
    const result = await forgejoCliExecFile(input.command, [...input.args], { cwd: input.cwd, encoding: "utf8" })
    return createResult(result.stdout)
  } catch {
    return createResultError("forgejoCliProcessExecute", `Command failed: ${input.command}`)
  }
}
