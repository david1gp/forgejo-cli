type ForgejoCliOption = {
  name: string
  short?: string
  value?: string
  description: string
  values?: readonly string[]
}

type ForgejoCliCommand = {
  description: string
  options?: readonly ForgejoCliOption[]
  commands?: Record<string, ForgejoCliCommand>
}

const forgejoCliRepositoryOptions: readonly ForgejoCliOption[] = [
  { name: "repo", short: "r", value: "REPO", description: "Repository as [HOST/]OWNER/NAME." },
  { name: "remote", short: "R", value: "REMOTE", description: "Use this Git remote for repository discovery." },
]

const forgejoCliIssueReferenceOptions: readonly ForgejoCliOption[] = [
  { name: "repo", short: "r", value: "REPO", description: "Repository used when an issue number is supplied." },
  { name: "remote", short: "R", value: "REMOTE", description: "Use this Git remote for repository discovery." },
]

const forgejoCliBodyOptions: readonly ForgejoCliOption[] = [
  { name: "body", value: "TEXT", description: "Body text." },
  { name: "body-file", value: "FILE", description: "Read the body from FILE; use - for stdin." },
  { name: "stdin", description: "Read the body from stdin." },
  { name: "editor", description: "Open the editor explicitly when no text is supplied." },
]

const forgejoCliCommandHierarchy: ForgejoCliCommand = {
  description: "A small, scriptable command-line client for Forgejo.",
  options: [
    {
      name: "host",
      short: "H",
      value: "HOST",
      description: "Forgejo host or base URL; otherwise use the current Git remote.",
    },
    {
      name: "cwd",
      short: "C",
      value: "DIR",
      description: "Run Git and host discovery from DIR.",
    },
    {
      name: "style",
      value: "STYLE",
      description: "Human output style.",
      values: ["fancy", "minimal"],
    },
    {
      name: "json",
      description: "Render machine-readable JSON.",
    },
  ],
  commands: {
    version: {
      description: "Print the fj version.",
      options: [{ name: "verbose", short: "v", description: "Include build and runtime details." }],
    },
    whoami: {
      description: "Print the authenticated Forgejo user for a host.",
      options: [{ name: "remote", short: "r", value: "REMOTE", description: "Use this Git remote." }],
    },
    repo: {
      description: "Manage Forgejo repositories.",
      commands: {
        create: {
          description: "Create a repository for the current user or organization.",
          options: [
            { name: "name", value: "NAME", description: "Repository name; also accepted as the first argument." },
            { name: "organization", short: "o", value: "ORG", description: "Create in this organization." },
            { name: "no-org", description: "Create in the authenticated user's personal namespace." },
            { name: "description", short: "d", value: "TEXT", description: "Repository description." },
            { name: "private", short: "P", description: "Create a private repository." },
            { name: "remote", short: "R", value: "REMOTE", description: "Add this Git remote after creation." },
            { name: "push", description: "Push the current branch after adding the remote." },
            { name: "ssh", short: "S", description: "Use SSH for local Git setup." },
            { name: "no-ssh", description: "Use HTTPS for local Git setup." },
          ],
        },
        fork: {
          description: "Fork a repository.",
          options: [
            { name: "name", value: "NAME", description: "Name for the fork." },
            { name: "organization", short: "o", value: "ORG", description: "Organization receiving the fork." },
            { name: "no-org", description: "Fork into the authenticated user's personal namespace." },
            ...forgejoCliRepositoryOptions.filter((option) => option.name === "remote"),
          ],
        },
        migrate: {
          description: "Migrate a repository from another Git service.",
          options: [
            { name: "name", value: "OWNER/NAME", description: "Destination repository name." },
            { name: "no-org", description: "Migrate into the authenticated user's personal namespace." },
            { name: "mirror", short: "m", description: "Create a mirror." },
            { name: "private", short: "P", description: "Create a private repository." },
            { name: "service", short: "s", value: "SERVICE", description: "Source service." },
            { name: "lfs-endpoint", short: "L", value: "URL", description: "LFS endpoint." },
            { name: "mirror-interval", value: "DURATION", description: "Mirror interval." },
            { name: "auth-username", value: "USER", description: "Source username." },
            { name: "auth-password", value: "PASSWORD", description: "Source password." },
            { name: "auth-token", value: "TOKEN", description: "Source token." },
            { name: "include", value: "ITEMS", description: "Comma-separated data to migrate." },
          ],
        },
        view: { description: "Show repository metadata.", options: forgejoCliRepositoryOptions },
        readme: { description: "Print the repository README.", options: forgejoCliRepositoryOptions },
        clone: {
          description: "Clone a repository locally.",
          options: [
            { name: "repo", short: "r", value: "REPO", description: "Repository as [HOST/]OWNER/NAME." },
            { name: "ssh", short: "S", description: "Clone using SSH." },
            { name: "no-ssh", description: "Clone using HTTPS." },
            { name: "identity-file", short: "I", value: "FILE", description: "SSH identity file." },
          ],
        },
        star: { description: "Star a repository.", options: forgejoCliRepositoryOptions },
        unstar: { description: "Remove a repository star.", options: forgejoCliRepositoryOptions },
        "star-status": {
          description: "Show repository star status.",
          options: [...forgejoCliRepositoryOptions, { name: "list", description: "List all starred repositories." }],
        },
        watch: { description: "Watch a repository.", options: forgejoCliRepositoryOptions },
        unwatch: { description: "Stop watching a repository.", options: forgejoCliRepositoryOptions },
        "watch-status": {
          description: "Show repository watch status.",
          options: [...forgejoCliRepositoryOptions, { name: "list", description: "List all watched repositories." }],
        },
        delete: {
          description: "Delete a repository (requires --yes or interactive confirmation).",
          options: [
            { name: "repo", short: "r", value: "REPO", description: "Repository to delete." },
            { name: "yes", short: "y", description: "Confirm deletion." },
            { name: "force", description: "Skip destructive confirmation." },
          ],
        },
        browse: { description: "Open a repository in the browser.", options: forgejoCliRepositoryOptions },
        labels: {
          description: "Manage repository labels.",
          options: forgejoCliRepositoryOptions,
          commands: {
            view: {
              description: "List repository labels.",
              options: [{ name: "archived", description: "Include archived labels." }],
            },
            create: {
              description: "Create a repository label.",
              options: [
                { name: "description", short: "d", value: "TEXT", description: "Label description." },
                { name: "exclusive", short: "e", description: "Make the label exclusive." },
                { name: "archived", short: "a", description: "Create the label archived." },
              ],
            },
            delete: {
              description: "Delete a repository label.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip destructive confirmation." },
              ],
            },
            edit: {
              description: "Edit a repository label.",
              options: [
                { name: "name", value: "NAME", description: "New label name." },
                { name: "color", value: "COLOR", description: "New label color." },
                { name: "description", short: "d", value: "TEXT", description: "New label description." },
                { name: "exclusive", value: "BOOL", description: "Set exclusivity." },
                { name: "archived", value: "BOOL", description: "Set archived state." },
              ],
            },
          },
        },
        edit: {
          description: "Edit repository metadata.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "archived", value: "BOOL", description: "Set archived state." },
            { name: "default-branch", value: "BRANCH", description: "Set the default branch." },
            { name: "description", short: "d", value: "TEXT", description: "Set the description." },
            { name: "enable-prune", value: "BOOL", description: "Set mirror pruning." },
            { name: "mirror-interval", value: "DURATION", description: "Set mirror interval." },
            { name: "name", value: "NAME", description: "Set repository name." },
            { name: "private", value: "BOOL", description: "Set visibility." },
            { name: "template", value: "BOOL", description: "Set template state." },
            { name: "website", value: "URL", description: "Set website URL." },
            { name: "avatar", short: "A", value: "FILE", description: "Upload a repository avatar from FILE." },
            { name: "unset-avatar", short: "u", description: "Remove the repository avatar; conflicts with --avatar." },
          ],
        },
        units: {
          description: "Enable or configure repository units.",
          options: forgejoCliRepositoryOptions,
          commands: {
            issues: {
              description: "Configure issues.",
              options: [{ name: "enable", value: "BOOL", description: "Enable issues." }],
            },
            prs: {
              description: "Configure pull requests.",
              options: [
                { name: "enable", value: "BOOL", description: "Enable pull requests." },
                {
                  name: "allow-fast-forward-only-merge",
                  value: "BOOL",
                  description: "Allow fast-forward-only merges.",
                },
                { name: "allow-manual-merge", value: "BOOL", description: "Allow manual merges." },
                { name: "allow-merge-commits", value: "BOOL", description: "Allow merge commits." },
                { name: "allow-rebase", value: "BOOL", description: "Allow rebasing." },
                { name: "allow-rebase-explicit", value: "BOOL", description: "Allow explicit rebasing." },
                { name: "allow-rebase-update", value: "BOOL", description: "Allow updating by rebase." },
                { name: "allow-squash-merge", value: "BOOL", description: "Allow squash merges." },
                { name: "autodetect-manual-merge", value: "BOOL", description: "Detect manual merges." },
                {
                  name: "default-allow-maintainer-edit",
                  value: "BOOL",
                  description: "Allow maintainer edits by default.",
                },
                {
                  name: "default-delete-branch-after-merge",
                  value: "BOOL",
                  description: "Delete branches after merge by default.",
                },
                { name: "default-merge-style", value: "STYLE", description: "Default merge style." },
                { name: "default-update-style", value: "STYLE", description: "Default update style." },
                { name: "ignore-whitespace-conflicts", value: "BOOL", description: "Ignore whitespace conflicts." },
              ],
            },
            actions: {
              description: "Configure actions.",
              options: [{ name: "enable", value: "BOOL", description: "Enable actions." }],
            },
            wiki: {
              description: "Configure the wiki.",
              options: [
                { name: "enable", value: "BOOL", description: "Enable the wiki." },
                { name: "branch", value: "BRANCH", description: "Wiki branch." },
                { name: "external-url", value: "URL", description: "External wiki URL." },
                { name: "globally-editable", value: "BOOL", description: "Allow global editing." },
              ],
            },
            packages: {
              description: "Configure packages.",
              options: [{ name: "enable", value: "BOOL", description: "Enable packages." }],
            },
            projects: {
              description: "Configure projects.",
              options: [{ name: "enable", value: "BOOL", description: "Enable projects." }],
            },
            releases: {
              description: "Configure releases.",
              options: [{ name: "enable", value: "BOOL", description: "Enable releases." }],
            },
          },
        },
      },
    },
    issue: {
      description: "Manage Forgejo issues.",
      commands: {
        create: {
          description: "Create an issue.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            { name: "title", value: "TITLE", description: "Issue title; also accepted as the first argument." },
            ...forgejoCliBodyOptions,
            { name: "label", short: "l", value: "LABEL", description: "Add a label; repeatable." },
            { name: "assignee", short: "a", value: "USER", description: "Assign a user; repeatable." },
            { name: "template", value: "NAME", description: "Use an issue template." },
            { name: "no-template", description: "Do not use repository templates." },
            { name: "web", description: "Open the web issue form instead of creating." },
          ],
        },
        edit: {
          description: "Edit an issue or one of its fields.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            ...forgejoCliBodyOptions,
            { name: "title", value: "TITLE", description: "New title." },
            { name: "state", value: "STATE", description: "open or closed." },
            { name: "assignee", short: "a", value: "USER", description: "Set an assignee; repeatable." },
            { name: "label-add", value: "LABEL", description: "Add a label; repeatable." },
            { name: "label-remove", value: "LABEL", description: "Remove a label; repeatable." },
          ],
          commands: {
            title: {
              description: "Edit the issue title.",
              options: [{ name: "editor", description: "Open the editor explicitly when no title is supplied." }],
            },
            body: { description: "Edit the issue body.", options: forgejoCliBodyOptions },
            comment: { description: "Edit one issue comment by zero-based index.", options: forgejoCliBodyOptions },
            labels: {
              description: "Edit issue labels.",
              options: [
                { name: "add", short: "a", value: "LABEL", description: "Add a label; repeatable." },
                { name: "rm", short: "r", value: "LABEL", description: "Remove a label; repeatable." },
              ],
            },
          },
        },
        comment: {
          description: "Add an issue comment.",
          options: [...forgejoCliIssueReferenceOptions, ...forgejoCliBodyOptions],
        },
        assign: { description: "Assign users to an issue.", options: forgejoCliIssueReferenceOptions },
        unassign: { description: "Remove users from an issue.", options: forgejoCliIssueReferenceOptions },
        close: {
          description: "Close an issue (requires --yes or interactive confirmation).",
          options: [
            ...forgejoCliIssueReferenceOptions,
            ...forgejoCliBodyOptions,
            { name: "message", value: "TEXT", description: "Comment before closing." },
            { name: "yes", short: "y", description: "Confirm closing." },
          ],
        },
        search: {
          description: "Search or list issues.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            { name: "labels", short: "l", value: "LABELS", description: "Comma-separated labels." },
            { name: "creator", short: "c", value: "USER", description: "Creator filter." },
            { name: "assignee", short: "a", value: "USER", description: "Assignee filter." },
            { name: "state", short: "s", value: "STATE", description: "open, closed, or all." },
            { name: "page", short: "p", value: "N", description: "Page number." },
            { name: "limit", value: "N", description: "Page size." },
            { name: "all", description: "Fetch all pages." },
          ],
        },
        view: {
          description: "Show an issue.",
          options: forgejoCliIssueReferenceOptions,
          commands: {
            body: { description: "Print only the issue body." },
            comment: { description: "Show one comment by zero-based index." },
            comments: { description: "List issue comments." },
            assignees: { description: "List issue assignees." },
          },
        },
        templates: { description: "List issue templates.", options: forgejoCliIssueReferenceOptions },
        browse: { description: "Open an issue in the browser.", options: forgejoCliIssueReferenceOptions },
        depend: {
          description: "Manage issue dependencies.",
          commands: {
            add: { description: "Add dependencies.", options: forgejoCliIssueReferenceOptions },
            remove: {
              description: "Remove dependencies.",
              options: [
                ...forgejoCliIssueReferenceOptions,
                { name: "yes", short: "y", description: "Confirm removal." },
              ],
            },
            list: { description: "List dependencies.", options: forgejoCliIssueReferenceOptions },
          },
        },
        block: {
          description: "Manage issues blocked by this issue.",
          commands: {
            add: { description: "Add blocked-by relationships.", options: forgejoCliIssueReferenceOptions },
            remove: {
              description: "Remove blocked-by relationships.",
              options: [
                ...forgejoCliIssueReferenceOptions,
                { name: "yes", short: "y", description: "Confirm removal." },
              ],
            },
            list: { description: "List blocked-by relationships.", options: forgejoCliIssueReferenceOptions },
          },
        },
      },
    },
    pr: {
      description: "Manage Forgejo pull requests.",
      commands: {
        search: {
          description: "Search or list pull requests.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "labels", short: "l", value: "LABELS", description: "Comma-separated labels." },
            { name: "creator", short: "c", value: "USER", description: "Creator filter." },
            { name: "assignee", short: "a", value: "USER", description: "Assignee filter." },
            { name: "state", short: "s", value: "STATE", description: "open, closed, or all." },
            { name: "page", short: "p", value: "N", description: "Page number." },
            { name: "limit", value: "N", description: "Page size." },
            { name: "all", description: "Fetch all pages." },
          ],
        },
        create: {
          description: "Create a pull request.",
          options: [
            ...forgejoCliRepositoryOptions,
            {
              name: "title",
              short: "t",
              value: "TITLE",
              description: "Pull request title; also accepted as the first argument.",
            },
            { name: "base", value: "BRANCH", description: "Base branch; prefix with ^ for the parent repository." },
            { name: "head", value: "BRANCH", description: "Head branch." },
            ...forgejoCliBodyOptions,
            { name: "autofill", short: "A", description: "Use the current branch as a title when possible." },
            { name: "web", short: "w", description: "Open the pull request compare page." },
          ],
        },
        view: {
          description: "Show a pull request.",
          options: forgejoCliIssueReferenceOptions,
          commands: {
            body: { description: "Print only the pull request body." },
            comment: { description: "Show one comment by zero-based index." },
            comments: { description: "List pull request comments." },
            labels: { description: "List pull request labels." },
            assignees: { description: "List pull request assignees." },
            diff: {
              description: "Print the pull request diff or patch.",
              options: [
                { name: "patch", short: "p", description: "Request patch format instead of unified diff." },
                { name: "editor", short: "e", description: "Open the diff or patch in the editor." },
              ],
            },
            files: { description: "List files changed by the pull request." },
            commits: {
              description: "List commits in the pull request.",
              options: [{ name: "oneline", short: "o", description: "Print one line per commit." }],
            },
          },
        },
        status: {
          description: "Show pull request merge and commit status.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            { name: "wait", description: "Wait for pending checks to finish." },
          ],
        },
        checkout: {
          description: "Fetch and check out a pull request branch.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            { name: "branch", value: "NAME", description: "Local branch name." },
            { name: "ssh", short: "S", description: "Fetch using SSH." },
            { name: "no-ssh", description: "Fetch using HTTPS." },
            { name: "identity-file", short: "I", value: "FILE", description: "SSH identity file." },
          ],
        },
        comment: {
          description: "Add a pull request comment.",
          options: [...forgejoCliIssueReferenceOptions, ...forgejoCliBodyOptions],
        },
        assign: { description: "Assign users to a pull request.", options: forgejoCliIssueReferenceOptions },
        unassign: { description: "Remove users from a pull request.", options: forgejoCliIssueReferenceOptions },
        depend: {
          description: "Manage pull request dependencies.",
          commands: {
            add: { description: "Add dependencies.", options: forgejoCliIssueReferenceOptions },
            remove: {
              description: "Remove dependencies.",
              options: [
                ...forgejoCliIssueReferenceOptions,
                { name: "yes", short: "y", description: "Confirm removal." },
              ],
            },
            list: { description: "List dependencies.", options: forgejoCliIssueReferenceOptions },
          },
        },
        block: {
          description: "Manage pull requests blocked by this pull request.",
          commands: {
            add: { description: "Add blocked-by relationships.", options: forgejoCliIssueReferenceOptions },
            remove: {
              description: "Remove blocked-by relationships.",
              options: [
                ...forgejoCliIssueReferenceOptions,
                { name: "yes", short: "y", description: "Confirm removal." },
              ],
            },
            list: { description: "List blocked-by relationships.", options: forgejoCliIssueReferenceOptions },
          },
        },
        edit: {
          description: "Edit a pull request or one of its fields.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            ...forgejoCliBodyOptions,
            { name: "title", value: "TITLE", description: "New title." },
            { name: "state", value: "STATE", description: "open or closed." },
            { name: "assignee", short: "a", value: "USER", description: "Set an assignee; repeatable." },
            { name: "label-add", value: "LABEL", description: "Add a label; repeatable." },
            { name: "label-remove", value: "LABEL", description: "Remove a label; repeatable." },
          ],
          commands: {
            title: {
              description: "Edit the pull request title.",
              options: [{ name: "editor", description: "Open the editor explicitly when no title is supplied." }],
            },
            body: { description: "Edit the pull request body.", options: forgejoCliBodyOptions },
            comment: {
              description: "Edit one pull request comment by zero-based index.",
              options: forgejoCliBodyOptions,
            },
            labels: {
              description: "Edit pull request labels.",
              options: [
                { name: "add", short: "a", value: "LABEL", description: "Add a label; repeatable." },
                { name: "rm", short: "r", value: "LABEL", description: "Remove a label; repeatable." },
              ],
            },
          },
        },
        close: {
          description: "Close a pull request (requires --yes or interactive confirmation).",
          options: [
            ...forgejoCliIssueReferenceOptions,
            ...forgejoCliBodyOptions,
            { name: "message", value: "TEXT", description: "Comment before closing." },
            { name: "yes", short: "y", description: "Confirm closing." },
          ],
        },
        merge: {
          description: "Merge a pull request.",
          options: [
            ...forgejoCliIssueReferenceOptions,
            {
              name: "method",
              short: "M",
              value: "METHOD",
              description: "merge, rebase, rebase-merge, squash, or manual.",
            },
            { name: "delete", short: "d", description: "Delete the head branch after merging." },
            { name: "title", short: "t", value: "TITLE", description: "Merge commit title." },
            { name: "message", short: "m", value: "TEXT", description: "Merge commit message." },
            { name: "editor", description: "Edit the merge commit message." },
            { name: "yes", short: "y", description: "Confirm the merge." },
          ],
        },
        browse: { description: "Open a pull request in the browser.", options: forgejoCliIssueReferenceOptions },
        review: {
          description: "List pull request reviews.",
          options: forgejoCliIssueReferenceOptions,
          commands: {
            list: {
              description: "List reviews and optionally review comments.",
              options: [
                { name: "comments", short: "c", description: "Include review comments." },
                { name: "all", short: "a", description: "Include stale and dismissed reviews." },
              ],
            },
          },
        },
      },
    },
    wiki: {
      description: "Read and clone repository wikis.",
      options: forgejoCliRepositoryOptions,
      commands: {
        contents: { description: "List wiki pages.", options: forgejoCliRepositoryOptions },
        view: {
          description: "Print a wiki page.",
          options: forgejoCliRepositoryOptions,
        },
        clone: {
          description: "Clone the repository wiki locally.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "path", short: "p", value: "PATH", description: "Destination directory." },
            { name: "ssh", short: "S", description: "Clone using SSH." },
            { name: "no-ssh", description: "Clone using HTTPS." },
            { name: "identity-file", short: "I", value: "FILE", description: "SSH identity file." },
          ],
        },
        browse: { description: "Open a wiki page in the browser.", options: forgejoCliRepositoryOptions },
      },
    },
    actions: {
      description: "Inspect and manage Forgejo Actions.",
      options: forgejoCliRepositoryOptions,
      commands: {
        tasks: {
          description: "List workflow tasks.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "page", short: "p", value: "N", description: "Page number." },
          ],
        },
        variables: {
          description: "Manage Actions variables.",
          options: forgejoCliRepositoryOptions,
          commands: {
            list: {
              description: "List Actions variables.",
              options: [
                ...forgejoCliRepositoryOptions,
                { name: "verbose", short: "v", description: "Show IDs and values." },
              ],
            },
            create: {
              description: "Create or update an Actions variable.",
              options: [
                ...forgejoCliRepositoryOptions,
                { name: "force", short: "f", description: "Update an existing variable." },
              ],
            },
            delete: {
              description: "Delete an Actions variable.",
              options: [
                ...forgejoCliRepositoryOptions,
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip destructive confirmation." },
              ],
            },
          },
        },
        secrets: {
          description: "Manage Actions secrets.",
          options: forgejoCliRepositoryOptions,
          commands: {
            list: { description: "List Actions secrets.", options: forgejoCliRepositoryOptions },
            create: { description: "Create or replace an Actions secret.", options: forgejoCliRepositoryOptions },
            delete: {
              description: "Delete an Actions secret.",
              options: [
                ...forgejoCliRepositoryOptions,
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip destructive confirmation." },
              ],
            },
          },
        },
        dispatch: {
          description: "Dispatch a workflow.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "inputs", short: "I", value: "KEY=VALUE", description: "Workflow input; repeatable." },
          ],
        },
      },
    },
    user: {
      description: "Manage Forgejo users.",
      options: [
        { name: "remote", short: "R", value: "REMOTE", description: "Use this Git remote for host discovery." },
      ],
      commands: {
        search: {
          description: "Search for users.",
          options: [{ name: "page", short: "p", value: "N", description: "Result page." }],
        },
        view: { description: "Show a user profile." },
        browse: { description: "Open a user profile in the browser." },
        follow: { description: "Follow a user." },
        unfollow: { description: "Unfollow a user." },
        following: { description: "List users followed by a user." },
        followers: { description: "List a user's followers." },
        block: { description: "Block a user." },
        unblock: { description: "Unblock a user." },
        repos: {
          description: "List a user's repositories.",
          options: [
            { name: "starred", description: "List starred repositories." },
            { name: "sort", value: "ORDER", description: "name, modified, created, stars, or forks." },
            { name: "page", short: "p", value: "N", description: "Result page." },
          ],
        },
        orgs: { description: "List a user's organizations." },
        activity: { description: "List a user's activity." },
        edit: {
          description: "Edit the current user profile.",
          commands: {
            bio: { description: "Edit the profile biography." },
            name: {
              description: "Set or unset the full name.",
              options: [{ name: "unset", short: "u", description: "Clear the value." }],
            },
            pronouns: {
              description: "Set or unset pronouns.",
              options: [{ name: "unset", short: "u", description: "Clear the value." }],
            },
            location: {
              description: "Set or unset the location.",
              options: [{ name: "unset", short: "u", description: "Clear the value." }],
            },
            activity: {
              description: "Set activity visibility.",
              options: [{ name: "visibility", short: "v", value: "SETTING", description: "hidden or public." }],
            },
            email: {
              description: "Edit email visibility and addresses.",
              options: [
                { name: "visibility", short: "v", value: "SETTING", description: "hidden or public." },
                { name: "add", short: "a", value: "EMAIL", description: "Add an email; repeatable." },
                { name: "rm", short: "r", value: "EMAIL", description: "Remove an email; repeatable." },
              ],
            },
            website: {
              description: "Set or unset the website.",
              options: [{ name: "unset", short: "u", description: "Clear the value." }],
            },
          },
        },
        key: {
          description: "Manage SSH keys.",
          commands: {
            list: {
              description: "List SSH keys.",
              options: [{ name: "verbose", short: "v", description: "Show key details." }],
            },
            view: { description: "Show an SSH key." },
            delete: {
              description: "Delete an SSH key.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip confirmation." },
              ],
            },
            upload: {
              description: "Upload an SSH public key.",
              options: [
                { name: "title", short: "t", value: "TITLE", description: "Key title." },
                { name: "force", short: "f", description: "Skip public-key validation." },
                { name: "read-only", short: "r", description: "Create a read-only key." },
              ],
            },
          },
        },
        keys: {
          description: "Alias for key.",
          commands: {
            list: {
              description: "List SSH keys.",
              options: [{ name: "verbose", short: "v", description: "Show key details." }],
            },
            view: { description: "Show an SSH key." },
            delete: {
              description: "Delete an SSH key.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip confirmation." },
              ],
            },
            upload: {
              description: "Upload an SSH public key.",
              options: [
                { name: "title", short: "t", value: "TITLE", description: "Key title." },
                { name: "force", short: "f", description: "Skip public-key validation." },
                { name: "read-only", short: "r", description: "Create a read-only key." },
              ],
            },
          },
        },
        gpg: {
          description: "Manage GPG keys.",
          commands: {
            list: {
              description: "List GPG keys.",
              options: [{ name: "verbose", short: "v", description: "Show key details." }],
            },
            view: { description: "Show a GPG key." },
            delete: {
              description: "Delete a GPG key.",
              options: [
                { name: "force", short: "f", description: "Skip confirmation." },
                { name: "yes", short: "y", description: "Confirm deletion." },
              ],
            },
            upload: {
              description: "Export and upload a local GPG key.",
              options: [{ name: "no-verify", short: "n", description: "Do not sign Forgejo's verification token." }],
            },
            verify: { description: "Verify a GPG key." },
          },
        },
      },
    },
    org: {
      description: "Manage Forgejo organizations.",
      options: [
        { name: "remote", short: "R", value: "REMOTE", description: "Use this Git remote for host discovery." },
      ],
      commands: {
        list: {
          description: "List organizations.",
          options: [
            { name: "page", short: "p", value: "N", description: "Result page." },
            { name: "only-member-of", short: "m", description: "List only organizations the current user belongs to." },
          ],
        },
        view: { description: "Show an organization." },
        create: {
          description: "Create an organization.",
          options: [
            { name: "full-name", short: "f", value: "TEXT", description: "Full display name." },
            { name: "description", short: "d", value: "TEXT", description: "Description." },
            { name: "email", short: "e", value: "EMAIL", description: "Email address." },
            { name: "location", short: "l", value: "TEXT", description: "Location." },
            { name: "website", short: "w", value: "URL", description: "Website." },
            { name: "visibility", short: "v", value: "SETTING", description: "private, limited, or public." },
            {
              name: "admin-can-change-team-access",
              value: "BOOL",
              description: "Allow administrators to change team access.",
            },
          ],
        },
        edit: {
          description: "Edit an organization.",
          options: [
            { name: "full-name", short: "f", value: "TEXT", description: "Full display name." },
            { name: "description", short: "d", value: "TEXT", description: "Description." },
            { name: "email", short: "e", value: "EMAIL", description: "Email address." },
            { name: "location", short: "l", value: "TEXT", description: "Location." },
            { name: "website", short: "w", value: "URL", description: "Website." },
            { name: "visibility", short: "v", value: "SETTING", description: "private, limited, or public." },
            {
              name: "admin-can-change-team-access",
              value: "BOOL",
              description: "Allow administrators to change team access.",
            },
          ],
        },
        activity: { description: "List organization activity." },
        members: {
          description: "List organization members.",
          options: [{ name: "page", short: "p", value: "N", description: "Result page." }],
        },
        visibility: {
          description: "Show or set the current user's member visibility.",
          options: [{ name: "set", short: "s", value: "SETTING", description: "public or private." }],
        },
        team: {
          description: "Manage organization teams.",
          commands: {
            list: { description: "List teams." },
            view: {
              description: "Show a team.",
              options: [{ name: "list-permissions", short: "p", description: "Show permission units." }],
            },
            create: {
              description: "Create a team.",
              options: [
                { name: "description", short: "d", value: "TEXT", description: "Description." },
                { name: "read-permissions", short: "r", value: "UNITS", description: "Read units or all." },
                { name: "write-permissions", short: "w", value: "UNITS", description: "Write units or all." },
                { name: "can-create-repos", short: "c", description: "Allow repository creation." },
                { name: "include-all-repos", short: "i", description: "Include all repositories." },
                { name: "admin", short: "A", description: "Create an administrator team." },
              ],
            },
            edit: {
              description: "Edit a team.",
              options: [
                { name: "new-name", short: "n", value: "NAME", description: "New team name." },
                { name: "description", short: "d", value: "TEXT", description: "Description." },
                { name: "read-permissions", short: "r", value: "UNITS", description: "Read units or all." },
                { name: "write-permissions", short: "w", value: "UNITS", description: "Write units or all." },
                { name: "can-create-repos", short: "c", value: "BOOL", description: "Set repository creation." },
                { name: "include-all-repos", short: "i", value: "BOOL", description: "Set all repositories." },
                { name: "admin", short: "A", value: "BOOL", description: "Set administrator permission." },
              ],
            },
            delete: {
              description: "Delete a team.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip confirmation." },
              ],
            },
            repo: {
              description: "Manage team repositories.",
              commands: {
                list: {
                  description: "List team repositories.",
                  options: [{ name: "page", short: "p", value: "N", description: "Result page." }],
                },
                add: { description: "Add a repository to a team." },
                rm: {
                  description: "Remove a repository from a team.",
                  options: [
                    { name: "yes", short: "y", description: "Confirm removal." },
                    { name: "force", description: "Skip confirmation." },
                  ],
                },
              },
            },
            member: {
              description: "Manage team members.",
              commands: {
                list: {
                  description: "List team members.",
                  options: [{ name: "page", short: "p", value: "N", description: "Result page." }],
                },
                add: { description: "Add a member to a team." },
                rm: {
                  description: "Remove a member from a team.",
                  options: [
                    { name: "yes", short: "y", description: "Confirm removal." },
                    { name: "force", description: "Skip confirmation." },
                  ],
                },
              },
            },
          },
        },
        label: {
          description: "Manage organization labels.",
          commands: {
            list: { description: "List labels." },
            add: {
              description: "Create a label.",
              options: [
                { name: "description", short: "d", value: "TEXT", description: "Description." },
                { name: "exclusive", short: "e", description: "Make the label exclusive." },
              ],
            },
            edit: {
              description: "Edit a label.",
              options: [
                { name: "new-name", short: "n", value: "NAME", description: "New label name." },
                { name: "color", short: "c", value: "COLOR", description: "Label color." },
                { name: "description", short: "d", value: "TEXT", description: "Description." },
                { name: "exclusive", short: "e", value: "BOOL", description: "Set exclusivity." },
                { name: "archived", short: "a", value: "BOOL", description: "Set archived state." },
              ],
            },
            rm: {
              description: "Delete a label.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip confirmation." },
              ],
            },
            delete: {
              description: "Alias for rm.",
              options: [
                { name: "yes", short: "y", description: "Confirm deletion." },
                { name: "force", description: "Skip confirmation." },
              ],
            },
          },
        },
        repo: {
          description: "Manage organization repositories.",
          commands: {
            list: {
              description: "List organization repositories.",
              options: [{ name: "page", short: "p", value: "N", description: "Result page." }],
            },
            create: {
              description: "Create an organization repository.",
              options: [
                { name: "description", short: "d", value: "TEXT", description: "Description." },
                { name: "private", short: "P", description: "Create a private repository." },
                { name: "auto-init", description: "Initialize the repository." },
                { name: "default-branch", value: "BRANCH", description: "Default branch." },
                { name: "readme", value: "NAME", description: "README template." },
              ],
            },
          },
        },
      },
    },
    release: {
      description: "Manage Forgejo releases and release assets.",
      options: forgejoCliRepositoryOptions,
      commands: {
        create: {
          description: "Create a release, optionally creating its tag.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "tag", short: "t", value: "TAG", description: "Use an existing or new tag." },
            {
              name: "create-tag",
              short: "T",
              value: "[TAG]",
              description: "Create a tag, defaulting to the release name.",
            },
            { name: "attach", short: "a", value: "FILE[:ASSET]", description: "Attach a file; repeatable." },
            {
              name: "body",
              short: "b",
              value: "[TEXT]",
              description: "Release body, or open the editor when omitted.",
            },
            { name: "body-file", value: "FILE", description: "Read the body from FILE; use - for stdin." },
            { name: "stdin", description: "Read the body from stdin." },
            { name: "editor", description: "Open the editor for the body." },
            { name: "branch", short: "B", value: "BRANCH", description: "Target branch when creating a tag." },
            { name: "draft", short: "d", description: "Create a draft release." },
            { name: "prerelease", short: "p", description: "Create a prerelease." },
          ],
        },
        edit: {
          description: "Edit a release by name.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "rename", short: "n", value: "NAME", description: "Rename the release." },
            { name: "tag", short: "t", value: "TAG", description: "Change the release tag." },
            {
              name: "body",
              short: "b",
              value: "[TEXT]",
              description: "Release body, or open the editor when omitted.",
            },
            { name: "body-file", value: "FILE", description: "Read the body from FILE; use - for stdin." },
            { name: "stdin", description: "Read the body from stdin." },
            { name: "editor", description: "Open the editor for the body." },
            { name: "draft", value: "BOOL", description: "Set draft state." },
            { name: "prerelease", value: "BOOL", description: "Set prerelease state." },
          ],
        },
        delete: {
          description: "Delete a release by name or tag.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "by-tag", short: "t", description: "Treat NAME as a tag." },
          ],
        },
        list: {
          description: "List releases.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "include-prerelease", short: "p", description: "Include prereleases." },
            { name: "include-draft", short: "d", description: "Include drafts." },
          ],
        },
        view: {
          description: "Show a release and its assets.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "by-tag", short: "t", description: "Treat NAME as a tag." },
          ],
        },
        browse: {
          description: "Open the repository releases page or one release in the browser.",
          options: forgejoCliRepositoryOptions,
        },
        asset: {
          description: "Manage release assets.",
          options: forgejoCliRepositoryOptions,
          commands: {
            create: {
              description: "Upload a release asset.",
              options: forgejoCliRepositoryOptions,
            },
            delete: {
              description: "Delete a release asset.",
              options: forgejoCliRepositoryOptions,
            },
            download: {
              description: "Download a release asset without overwriting an existing file.",
              options: [
                ...forgejoCliRepositoryOptions,
                { name: "output", short: "o", value: "PATH", description: "Destination path." },
              ],
            },
          },
        },
      },
    },
    tag: {
      description: "Manage repository tags.",
      options: forgejoCliRepositoryOptions,
      commands: {
        create: {
          description: "Create a tag.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "body", short: "b", value: "[TEXT]", description: "Tag message, or open the editor when omitted." },
            { name: "body-file", value: "FILE", description: "Read the message from FILE; use - for stdin." },
            { name: "stdin", description: "Read the message from stdin." },
            { name: "editor", description: "Open the editor for the message." },
            { name: "branch", short: "B", value: "BRANCH", description: "Target branch or commit." },
          ],
        },
        delete: { description: "Delete a tag.", options: forgejoCliRepositoryOptions },
        list: {
          description: "List tags.",
          options: [
            ...forgejoCliRepositoryOptions,
            { name: "page", short: "p", value: "N", description: "Page number." },
          ],
        },
        view: { description: "Show a tag.", options: forgejoCliRepositoryOptions },
      },
    },
    auth: {
      description: "Manage local Forgejo credentials.",
      commands: {
        "add-token": {
          description: "Store an application token without prompting.",
          options: [
            { name: "token", value: "TOKEN", description: "Application token (also accepted as the first argument)." },
          ],
        },
        login: {
          description: "Log in with browser OAuth or store an application token.",
          options: [
            { name: "token", value: "TOKEN", description: "Application token (also accepted as the first argument)." },
            {
              name: "client-id",
              value: "ID",
              description: "OAuth client ID; otherwise resolve it from env, config, or known hosts.",
            },
          ],
        },
        logout: { description: "Remove credentials for a host." },
        "use-ssh": { description: "Set whether a host prefers SSH for Git operations." },
        list: { description: "List hosts with stored credentials." },
      },
    },
    config: {
      description: "Manage persistent Forgejo defaults.",
      commands: {
        set: {
          description:
            "Set a persistent default with KEY VALUE. Supported keys: default-host, ssh-base, default-org, default-remote.",
        },
        unset: {
          description:
            "Unset a persistent default with KEY. Supported keys: default-host, ssh-base, default-org, default-remote.",
        },
        show: {
          description: "Show resolved defaults and their sources. Requires --resolved.",
          options: [{ name: "resolved", description: "Show effective values, paths, and sources." }],
        },
      },
    },
    completion: {
      description: "Generate shell completion for the actual fj command tree.",
      options: [
        { name: "bin-name", value: "NAME", description: "Command name used by the generated completion script." },
      ],
    },
  },
}

export { forgejoCliCommandHierarchy }
