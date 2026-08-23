import { expect, test } from "bun:test"
import { createResult } from "#result"
import { forgejoCliCompletionGenerate } from "../src/cli/forgejoCliCompletionGenerate.js"
import { forgejoCliParse } from "../src/cli/forgejoCliParse.js"
import { forgejoCliRun } from "../src/cli/forgejoCliRun.js"

test("parses release assets, optional editor bodies, and repository group options", () => {
  expect(
    forgejoCliParse(["release", "create", "First release", "--create-tag", "--body"], { stdoutIsTty: false }),
  ).toMatchObject({
    success: true,
    data: { kind: "release-create", createTag: true, editor: true },
  })
  expect(
    forgejoCliParse(
      ["release", "--repo", "alice/demo", "asset", "download", "First release", "app.zip", "-o", "out.zip"],
      { stdoutIsTty: false },
    ),
  ).toMatchObject({
    success: true,
    data: { kind: "release-asset-download", repository: "alice/demo", output: "out.zip" },
  })
  expect(
    forgejoCliParse(["tag", "create", "v1", "--body", "message", "--branch", "main"], { stdoutIsTty: false }),
  ).toMatchObject({
    success: true,
    data: { kind: "tag-create", body: "message", branch: "main" },
  })
  expect(forgejoCliParse(["release", "asset", "download", "--help"], { stdoutIsTty: false })).toEqual({
    success: true,
    data: { kind: "help", path: ["release", "asset", "download"] },
  })
  expect(forgejoCliCompletionGenerate("bash", "fj")).toContain("release")
  expect(forgejoCliCompletionGenerate("bash", "fj")).toContain("tag")
})

test("creates a release with injected stdin and filesystem reads", async () => {
  const output: string[] = []
  const requests: Request[] = []
  const result = await forgejoCliRun(
    [
      "--json",
      "release",
      "create",
      "First release",
      "--repo",
      "forgejo.example.test/alice/demo",
      "--tag",
      "v1",
      "--stdin",
      "--attach",
      "build.zip",
    ],
    {
      env: { FORGEJO_TOKEN: "test-token" },
      stdinRead: async () => createResult("release notes"),
      fileRead: async (path, encoding) => {
        expect(path).toBe("build.zip")
        expect(encoding).toBe("binary")
        return createResult(new Uint8Array([1, 2]))
      },
      fetch: async (input, init) => {
        const request = new Request(String(input), init)
        requests.push(request)
        if (request.method === "POST" && new URL(request.url).pathname.endsWith("/releases"))
          return new Response(JSON.stringify({ id: 9, name: "First release", tag_name: "v1", assets: [] }), {
            status: 201,
          })
        return new Response(JSON.stringify({ id: 4, name: "build.zip" }), { status: 201 })
      },
      outputWrite: (value) => {
        output.push(value)
        return createResult(null)
      },
    },
  )
  expect(result).toEqual({ success: true, data: 0 })
  expect(JSON.parse(output.join(""))).toMatchObject({
    release: { name: "First release" },
    assets: [{ name: "build.zip" }],
  })
  expect(requests).toHaveLength(2)
  expect(await requests[0]?.json()).toMatchObject({ tag_name: "v1", body: "release notes" })
})

test("downloads assets through injected filesystem writes without overwrite", async () => {
  const writes: { path: string; data: Uint8Array; exclusive?: boolean }[] = []
  const output: string[] = []
  const result = await forgejoCliRun(
    [
      "release",
      "asset",
      "download",
      "First release",
      "app.zip",
      "--repo",
      "forgejo.example.test/alice/demo",
      "--output",
      "app.zip",
    ],
    {
      env: { FORGEJO_TOKEN: "test-token" },
      fetch: async (input) => {
        const url = new URL(String(input))
        if (url.pathname.endsWith("/releases"))
          return new Response(JSON.stringify([{ id: 9, name: "First release", assets: [{ id: 4, name: "app.zip" }] }]))
        return new Response(new Uint8Array([3, 4]))
      },
      fileWrite: async (path, data, options) => {
        writes.push({ path, data, exclusive: options?.exclusive })
        return createResult(null)
      },
      outputWrite: (value) => {
        output.push(value)
        return createResult(null)
      },
    },
  )
  expect(result).toEqual({ success: true, data: 0 })
  expect(writes).toEqual([{ path: "app.zip", data: new Uint8Array([3, 4]), exclusive: true }])
  expect(output.join("")).toContain("Downloaded app.zip to app.zip")
})

test("lists tags as minimal names and sends the compatible page size", async () => {
  const output: string[] = []
  const result = await forgejoCliRun(["tag", "list", "--repo", "forgejo.example.test/alice/demo", "--page", "2"], {
    env: { FORGEJO_TOKEN: "test-token" },
    fetch: async (input) => {
      expect(String(input)).toContain("page=2")
      expect(String(input)).toContain("limit=20")
      return new Response(JSON.stringify([{ name: "v1" }, { name: "v2" }]))
    },
    outputWrite: (value) => {
      output.push(value)
      return createResult(null)
    },
  })
  expect(result).toEqual({ success: true, data: 0 })
  expect(output.join("")).toBe("v1\nv2\n")
})
