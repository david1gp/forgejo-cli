export function forgejoOrganizationPathCreate(organization: string): string {
  return `/api/v1/orgs/${encodeURIComponent(organization)}`
}
