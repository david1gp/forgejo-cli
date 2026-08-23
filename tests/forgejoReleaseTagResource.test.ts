import { expect, test } from "bun:test"
import {
  forgejoReleaseAssetDelete,
  forgejoReleaseAssetDownload,
  forgejoReleaseAssetGet,
  forgejoReleaseAssetUpload,
  forgejoReleaseCreate,
  forgejoReleaseDelete,
  forgejoReleaseEdit,
  forgejoReleaseGet,
  forgejoReleaseList,
  forgejoRestTransportCreate,
  forgejoTagCreate,
  forgejoTagDelete,
  forgejoTagGet,
  forgejoTagList,
} from "../src/index.js"

const release = {
  id: 9,
  tag_name: "v1.0.0",
  name: "First release",
  body: "notes",
  draft: false,
  prerelease: false,
  assets: [{ id: 4, name: "app.zip", size: 2 }],
}

test("release and tag resources use the mocked REST transport", async () => {
  const calls: { method: string; path: string; body: unknown }[] = []
  let assetMetadataServed = false
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body
      calls.push({ method, path: url.pathname + url.search, body })
      if (method === "POST" && url.pathname.endsWith("/releases"))
        return new Response(JSON.stringify(release), { status: 201 })
      if (method === "PATCH" && url.pathname.endsWith("/releases/9")) return new Response(JSON.stringify(release))
      if (method === "GET" && url.pathname.endsWith("/releases")) return new Response(JSON.stringify([release]))
      if (method === "GET" && url.pathname.endsWith("/releases/9")) return new Response(JSON.stringify(release))
      if (method === "GET" && url.pathname.endsWith("/releases/tags/v1.0.0"))
        return new Response(JSON.stringify(release))
      if (method === "GET" && url.pathname.endsWith("/assets/4") && !assetMetadataServed) {
        assetMetadataServed = true
        return new Response(JSON.stringify(release.assets[0]))
      }
      if (method === "POST" && url.pathname.endsWith("/assets"))
        return new Response(JSON.stringify({ id: 5, name: url.searchParams.get("name"), size: 2 }))
      if (method === "GET" && url.pathname.endsWith("/assets/4")) return new Response(new Uint8Array([1, 2]))
      if (method === "POST" && url.pathname.endsWith("/tags"))
        return new Response(JSON.stringify({ id: "tag-id", name: "v1.0.0", message: "tag" }), { status: 201 })
      if (method === "GET" && url.pathname.endsWith("/tags"))
        return new Response(JSON.stringify([{ id: "tag-id", name: "v1.0.0" }]))
      if (method === "GET" && url.pathname.endsWith("/tags/v1.0.0"))
        return new Response(JSON.stringify({ id: "tag-id", name: "v1.0.0" }))
      if (method === "DELETE") return new Response(null, { status: 204 })
      return new Response("not found", { status: 404 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  expect(
    (await forgejoReleaseCreate(transport.data, "alice/demo", { tagName: "v1.0.0", name: "First release" })).success,
  ).toBe(true)
  expect((await forgejoReleaseEdit(transport.data, "alice/demo", 9, { body: "updated" })).success).toBe(true)
  expect((await forgejoReleaseList(transport.data, "alice/demo")).success).toBe(true)
  expect((await forgejoReleaseGet(transport.data, "alice/demo", { tag: "v1.0.0" })).success).toBe(true)
  expect((await forgejoReleaseAssetGet(transport.data, "alice/demo", 9, 4)).success).toBe(true)
  const uploaded = await forgejoReleaseAssetUpload(transport.data, "alice/demo", 9, {
    name: "app.bin",
    data: new Uint8Array([3, 4]),
  })
  expect(uploaded.success).toBe(true)
  const downloaded = await forgejoReleaseAssetDownload(transport.data, "alice/demo", 9, 4)
  expect(downloaded).toEqual({ success: true, data: new Uint8Array([1, 2]) })
  expect((await forgejoReleaseAssetDelete(transport.data, "alice/demo", 9, 4)).success).toBe(true)
  expect((await forgejoReleaseDelete(transport.data, "alice/demo", 9)).success).toBe(true)

  expect((await forgejoTagCreate(transport.data, "alice/demo", { tagName: "v1.0.0" })).success).toBe(true)
  expect((await forgejoTagList(transport.data, "alice/demo")).success).toBe(true)
  expect((await forgejoTagGet(transport.data, "alice/demo", "v1.0.0")).success).toBe(true)
  expect((await forgejoTagDelete(transport.data, "alice/demo", "v1.0.0")).success).toBe(true)

  expect(calls.some((call) => call.method === "POST" && call.path.endsWith("/releases/9/assets?name=app.bin"))).toBe(
    true,
  )
  expect(calls.some((call) => call.method === "GET" && call.path.endsWith("/releases/9/assets/4"))).toBe(true)
})

test("asset overwrite is explicit and removes the matching existing asset first", async () => {
  const calls: string[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      calls.push(`${init?.method ?? "GET"} ${url.pathname}`)
      if (init?.method === "GET") return new Response(JSON.stringify(release))
      if (init?.method === "DELETE") return new Response(null, { status: 204 })
      return new Response(JSON.stringify({ id: 5, name: "app.zip" }))
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return
  const result = await forgejoReleaseAssetUpload(transport.data, "alice/demo", 9, {
    name: "app.zip",
    data: "replacement",
    overwrite: true,
  })
  expect(result.success).toBe(true)
  expect(calls).toEqual([
    "GET /api/v1/repos/alice/demo/releases/9",
    "DELETE /api/v1/repos/alice/demo/releases/9/assets/4",
    "POST /api/v1/repos/alice/demo/releases/9/assets",
  ])
})
