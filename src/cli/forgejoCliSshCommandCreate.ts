function forgejoCliSshCommandCreate(identityFile: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(identityFile)) return `ssh -i ${identityFile}`
  return `ssh -i '${identityFile.replaceAll("'", "'\\''")}'`
}

export { forgejoCliSshCommandCreate }
