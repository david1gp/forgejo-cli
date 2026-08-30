import { expect, test } from "bun:test"
import { forgejoConfigurationParse, forgejoDirectoryAssignmentResolve } from "../src/index.js"

test("selects the longest matching absolute directory assignment", () => {
  const assignments = {
    "/home/david": "default-team",
    "/home/david/leo": "contentoren",
    "/home/david/leo/client": null,
  }

  expect(forgejoDirectoryAssignmentResolve({ assignments, cwd: "/home/david/leo/client/repository" })).toEqual({
    noOrg: true,
  })
  expect(forgejoDirectoryAssignmentResolve({ assignments, cwd: "/home/david/leo/service" })).toEqual({
    organization: "contentoren",
  })
  expect(forgejoDirectoryAssignmentResolve({ assignments, cwd: "/home/david/tools" })).toEqual({
    organization: "default-team",
  })
  expect(forgejoDirectoryAssignmentResolve({ assignments, cwd: "/tmp/repository" })).toBeUndefined()
})

test("matches normalized absolute assignment paths without expanding home-directory notation", () => {
  const assignments = {
    "/home/david/leo/../leo": "contentoren",
  }

  expect(forgejoDirectoryAssignmentResolve({ assignments, cwd: "/home/david/leo/repository" })).toEqual({
    organization: "contentoren",
  })
  expect(
    forgejoDirectoryAssignmentResolve({
      assignments: { "~/leo": "wrong" },
      cwd: "/home/david/leo/repository",
    }),
  ).toBeUndefined()
})

test("validates directory assignments as absolute paths with organization or personal values", () => {
  expect(
    forgejoConfigurationParse({
      hosts: {},
      directory_assignments: {
        "/home/david/personal": null,
        "/home/david/leo": " contentoren ",
      },
    }),
  ).toEqual({
    success: true,
    data: {
      hosts: {},
      directory_assignments: {
        "/home/david/personal": null,
        "/home/david/leo": "contentoren",
      },
    },
  })

  expect(
    forgejoConfigurationParse({
      hosts: {},
      directory_assignments: { "~/personal": null },
    }).success,
  ).toBe(false)
})
