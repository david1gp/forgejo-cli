import { expect, test } from "bun:test"
import { forgejoCliSshResolve } from "../src/cli/forgejoCliSshResolve.js"

test("uses explicit SSH when enabled even when the host is not a default", () => {
  expect(
    forgejoCliSshResolve({
      ssh: true,
      host: "forgejo.example.test",
      defaultSsh: ["other.example.test"],
    }),
  ).toBe(true)
})

test("uses explicit HTTPS when disabled even when the host is a default", () => {
  expect(
    forgejoCliSshResolve({
      ssh: false,
      host: "forgejo.example.test",
      defaultSsh: ["forgejo.example.test"],
    }),
  ).toBe(false)
})

test("uses SSH when the resolved host is a default and no explicit option was supplied", () => {
  expect(forgejoCliSshResolve({ host: "forgejo.example.test", defaultSsh: ["forgejo.example.test"] })).toBe(true)
})

test("uses HTTPS when no explicit option or matching host default is supplied", () => {
  expect(forgejoCliSshResolve({ host: "forgejo.example.test", defaultSsh: ["other.example.test"] })).toBe(false)
  expect(forgejoCliSshResolve({ host: "forgejo.example.test" })).toBe(false)
})
