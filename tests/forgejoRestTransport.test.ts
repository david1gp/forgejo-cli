import { expect, test } from "bun:test"
import { forgejoRestTransportCreate } from "../src/index.js"

test("injects authentication and handles URL, JSON, and pagination metadata", async () => {
  let calledUrl = ""
  let calledInit: RequestInit | undefined
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test/forgejo",
    token: "application-token",
    fetch: async (input, init) => {
      calledUrl = String(input)
      calledInit = init
      return new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
          link: '<https://forgejo.example.test/api/v1/repos?page=2>; rel="next"',
          "x-total-count": "4",
        },
      })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const result = await transport.data.request<{ id: number }[]>({
    path: "/api/v1/repos",
    query: { page: 1, label: "my repo" },
  })

  expect(result).toEqual({
    success: true,
    data: {
      data: [{ id: 1 }],
      status: 200,
      statusText: "",
      headers: {
        "content-type": "application/json",
        link: '<https://forgejo.example.test/api/v1/repos?page=2>; rel="next"',
        "x-total-count": "4",
      },
      pagination: {
        next: "https://forgejo.example.test/api/v1/repos?page=2",
        totalCount: 4,
      },
    },
  })
  expect(calledUrl).toBe("https://forgejo.example.test/forgejo/api/v1/repos?page=1&label=my+repo")
  expect(new Headers(calledInit?.headers).get("Authorization")).toBe("token application-token")
})

test("maps Forgejo API errors and handles text and empty responses", async () => {
  const responses = [
    new Response(JSON.stringify({ message: "Not allowed" }), { status: 403 }),
    new Response("plain text", { status: 200 }),
    new Response(null, { status: 204 }),
  ]
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async () => responses.shift() as Response,
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const error = await transport.data.request({ path: "api/v1/private" })
  expect(error.success).toBe(false)
  if (!error.success) {
    expect(error.code).toBe("forgejo.forbidden")
    expect(error.statusCode).toBe(403)
    expect(error.errorMessage).toBe("Not allowed")
  }
  const text = await transport.data.request<string>({ path: "api/v1/text", responseType: "text" })
  expect(text.success && text.data.data).toBe("plain text")
  const empty = await transport.data.request({ path: "api/v1/empty", responseType: "empty" })
  expect(empty.success && empty.data.data).toBeNull()
})
