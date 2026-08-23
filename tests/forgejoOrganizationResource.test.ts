import { expect, test } from "bun:test"
import {
  forgejoOrganizationActivityList,
  forgejoOrganizationCreate,
  forgejoOrganizationEdit,
  forgejoOrganizationGet,
  forgejoOrganizationLabelCreate,
  forgejoOrganizationLabelDelete,
  forgejoOrganizationLabelEdit,
  forgejoOrganizationLabelsList,
  forgejoOrganizationList,
  forgejoOrganizationMemberVisibilityGet,
  forgejoOrganizationMembersList,
  forgejoOrganizationRepositoriesList,
  forgejoOrganizationRepositoryCreate,
  forgejoOrganizationTeamCreate,
  forgejoOrganizationTeamEdit,
  forgejoOrganizationTeamGet,
  forgejoOrganizationTeamMemberAdd,
  forgejoOrganizationTeamMembersList,
  forgejoOrganizationTeamMemberRemove,
  forgejoOrganizationTeamRepositoriesList,
  forgejoOrganizationTeamRepositoryAdd,
  forgejoOrganizationTeamRepositoryRemove,
  forgejoOrganizationTeamsList,
  forgejoRestTransportCreate,
} from "../src/index.js"

const organization = { id: 1, name: "acme", full_name: "Acme", visibility: "public" }
const team = { id: 7, name: "developers", permission: "write", organization }
const repository = { id: 2, name: "demo", full_name: "acme/demo" }
const label = { id: 3, name: "bug", color: "ff0000" }
const member = { id: 4, login: "alice", username: "alice" }

test("organization APIs cover lifecycle, teams, labels, members, and repositories", async () => {
  const calls: { path: string; method: string; body?: unknown }[] = []
  const transport = forgejoRestTransportCreate({
    baseUrl: "https://forgejo.example.test",
    fetch: async (input, init) => {
      const url = new URL(String(input))
      const method = init?.method ?? "GET"
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined
      calls.push({ path: url.pathname, method, ...(body === undefined ? {} : { body }) })
      if (url.pathname === "/api/v1/orgs")
        return new Response(JSON.stringify([organization]), { status: method === "POST" ? 201 : 200 })
      if (url.pathname === "/api/v1/orgs/acme") return new Response(JSON.stringify(organization), { status: 200 })
      if (url.pathname.endsWith("/activities")) return new Response(JSON.stringify([]), { status: 200 })
      if (url.pathname.endsWith("/members") || url.pathname.endsWith("/public_members")) {
        return new Response(JSON.stringify([member]), { status: 200 })
      }
      if (url.pathname === "/api/v1/orgs/acme/public_members/alice")
        return new Response(JSON.stringify(member), { status: 200 })
      if (url.pathname === "/api/v1/orgs/acme/teams")
        return new Response(JSON.stringify([team]), { status: method === "POST" ? 201 : 200 })
      if (url.pathname === "/api/v1/teams/7") return new Response(JSON.stringify(team), { status: 200 })
      if (url.pathname === "/api/v1/teams/7/repos") return new Response(JSON.stringify([repository]), { status: 200 })
      if (url.pathname === "/api/v1/teams/7/members") return new Response(JSON.stringify([member]), { status: 200 })
      if (url.pathname === "/api/v1/orgs/acme/labels")
        return new Response(JSON.stringify([label]), { status: method === "POST" ? 201 : 200 })
      if (url.pathname === "/api/v1/orgs/acme/repos")
        return new Response(JSON.stringify([repository]), { status: method === "POST" ? 201 : 200 })
      return new Response(null, { status: 204 })
    },
  })
  expect(transport.success).toBe(true)
  if (!transport.success) return

  const organizations = await forgejoOrganizationList(transport.data)
  expect(organizations.success && organizations.data[0]?.name).toBe("acme")
  const currentOrganization = await forgejoOrganizationGet(transport.data, "acme")
  expect(currentOrganization.success && currentOrganization.data.name).toBe("acme")
  await forgejoOrganizationCreate(transport.data, { name: "acme", visibility: "public" })
  await forgejoOrganizationEdit(transport.data, "acme", { description: "team" })
  await forgejoOrganizationActivityList(transport.data, "acme")
  const members = await forgejoOrganizationMembersList(transport.data, "acme")
  expect(members.success && members.data[0]?.login).toBe("alice")
  expect(await forgejoOrganizationMemberVisibilityGet(transport.data, "acme", "alice")).toEqual({
    success: true,
    data: "public",
  })
  const teams = await forgejoOrganizationTeamsList(transport.data, "acme")
  expect(teams.success && teams.data[0]?.id).toBe(7)
  const currentTeam = await forgejoOrganizationTeamGet(transport.data, "acme", 7)
  expect(currentTeam.success && currentTeam.data.name).toBe("developers")
  await forgejoOrganizationTeamCreate(transport.data, "acme", { name: "developers", admin: true })
  await forgejoOrganizationTeamEdit(transport.data, "acme", 7, { newName: "maintainers" })
  await forgejoOrganizationTeamEdit(transport.data, "acme", 7, { admin: false })
  const teamRepositories = await forgejoOrganizationTeamRepositoriesList(transport.data, "acme", 7)
  expect(teamRepositories.success && teamRepositories.data[0]?.name).toBe("demo")
  await forgejoOrganizationTeamRepositoryAdd(transport.data, "acme", 7, "demo")
  await forgejoOrganizationTeamRepositoryRemove(transport.data, "acme", 7, "demo")
  const teamMembers = await forgejoOrganizationTeamMembersList(transport.data, "acme", 7)
  expect(teamMembers.success && teamMembers.data[0]?.login).toBe("alice")
  await forgejoOrganizationTeamMemberAdd(transport.data, "acme", 7, "alice")
  await forgejoOrganizationTeamMemberRemove(transport.data, "acme", 7, "alice")
  const labels = await forgejoOrganizationLabelsList(transport.data, "acme")
  expect(labels.success && labels.data[0]?.name).toBe("bug")
  await forgejoOrganizationLabelCreate(transport.data, "acme", { name: "bug", color: "#ff0000" })
  await forgejoOrganizationLabelEdit(transport.data, "acme", "bug", { color: "00ff00" })
  await forgejoOrganizationLabelDelete(transport.data, "acme", "bug")
  const repositories = await forgejoOrganizationRepositoriesList(transport.data, "acme")
  expect(repositories.success && repositories.data[0]?.full_name).toBe("acme/demo")
  await forgejoOrganizationRepositoryCreate(transport.data, "acme", { name: "demo" })
  expect(calls.find((call) => call.path === "/api/v1/orgs/acme/teams" && call.method === "POST")?.body).toMatchObject({
    name: "developers",
    permission: "admin",
  })
  expect(calls.find((call) => call.path === "/api/v1/teams/7" && call.method === "PATCH")?.body).not.toHaveProperty(
    "permission",
  )
})
