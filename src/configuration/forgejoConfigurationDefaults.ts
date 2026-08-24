import type { ForgejoConfiguration } from "./forgejoConfigurationSchema.js"

type ForgejoConfigurationDefaults = Pick<
  ForgejoConfiguration,
  "default_host" | "ssh_base" | "default_org" | "default_remote"
>

export type { ForgejoConfigurationDefaults }
