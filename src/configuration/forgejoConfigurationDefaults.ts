import type { ForgejoConfiguration } from "./forgejoConfigurationSchema.js"

type ForgejoConfigurationDefaults = Pick<
  ForgejoConfiguration,
  "default_ssh" | "default_host" | "ssh_base" | "default_org" | "default_remote" | "directory_assignments"
>

export type { ForgejoConfigurationDefaults }
