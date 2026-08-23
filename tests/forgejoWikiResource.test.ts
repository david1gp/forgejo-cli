import { expect, test } from "bun:test"
import {
  forgejoRestTransportCreate,
  forgejoWikiCloneMetadataGet,
  forgejoWikiContentsGet,
  forgejoWikiPageGet,
} from "../src/index.js"

test("wiki resources use the existing mocked transport and derive wiki clone URLs", async () => {
  const calls: string[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input) => {
      const url = String(input)
      calls.push(url)
      const path = new URL(url).pathname
      if (path.endsWith("/wiki/pages"))
        return new Response(JSON.stringify([{ title: "Home", html_url: "https://forgejo.example.test/wiki/Home" }]))
      if (path.endsWith("/wiki/page/Home"))
        return new Response(JSON.stringify({ title: "Home", content_base64: "SGVsbG8=", sub_url: "/wiki/Home" }))
      return new Response(
        JSON.stringify({
          name: "demo",
          full_name: "alice/demo",
          clone_url: "https://forgejo.example.test/alice/demo.git",
          ssh_url: "ssh://git@forgejo.example.test/alice/demo.git",
        }),
      )
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const contents = await forgejoWikiContentsGet(transport.data, "alice/demo")
  expect(contents.success && contents.data[0]?.title).toBe("Home")
  const page = await forgejoWikiPageGet(transport.data, "alice/demo", "Home")
  expect(page.success && page.data.content_base64).toBe("SGVsbG8=")
  const clone = await forgejoWikiCloneMetadataGet(transport.data, "alice/demo")
  expect(clone.success && clone.data.cloneUrl).toBe("https://forgejo.example.test/alice/demo.wiki.git")
  expect(calls.some((url) => url.endsWith("/wiki/page/Home"))).toBe(true)
})

test("wiki page validation prevents a transport request", async () => {
  let requestCount = 0
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async () => {
      requestCount += 1
      return new Response("{}")
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return
  const result = await forgejoWikiPageGet(transport.data, "alice/demo", " ")
  expect(result.success).toBe(false)
  expect(requestCount).toBe(0)
})
