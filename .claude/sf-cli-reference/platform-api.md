# sf CLI v2 — System/CLI, limits & direct API

> `sf` v2 command catalog, sections §1, §12, §13. Catalog version, conventions, and global flags: see `INDEX.md`.

## 1. System & global

### `sf help [COMMAND]`
Show the help for a command or the global list.
Flags: `--all` (all commands, including hidden) · `--nested-commands`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf commands`
List all commands.
Flags: `-c, --columns=<value>` · `-x, --extended` · `--filter=<value>` · `--no-header` · `--no-truncate` · `--sort=<value>` · `--tree` · `--deprecated` · `--hidden`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf search`
Interactive search across commands.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf version` / `sf --version`
CLI, Node, OS version.
Flags: `--verbose` (version of each plugin).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf which`
Show which plugin a command comes from.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf update [CHANNEL]`
Update the CLI.
Flags: `-a, --available` (list the versions) · `-i, --interactive` · `--force` · `-v, --version=<value>`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf autocomplete [SHELL]`
Generate the autocomplete script (bash, zsh, powershell).
Flags: `-r, --refresh-cache`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### Plugins

### `sf plugins`
List the installed plugins.
Flags: `--core` (include core plugins) · `-x, --extended`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf plugins install <plugin>`
Install a plugin (npm or URL).
Flags: `-f, --force` · `-s, --silent` · `-v, --verbose`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf plugins inspect <plugin>`
Details of an installed plugin.
Flags: `-h, --help` · `-v, --verbose`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf plugins link <path>`
Link a locally developed plugin.
Flags: `--install/--no-install` · `-v, --verbose`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf plugins uninstall <plugin>`
Uninstall a plugin.
Flags: `--help` · `-v, --verbose`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf plugins update`
Update all plugins.
Flags: `-h, --help` · `-v, --verbose`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf plugins trust verify <plugin>`
Verify a plugin's signature.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

---

## 12. Limits & diagnostics

### `sf limits api display`
Show the org's API limits.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf limits recordcounts display`
Record count per object.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf info releasenotes display`
Show the CLI release notes.
Flags: `-v, --version=<value>` (CLI version).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf doctor`
Diagnose the installation and environment.
Flags: `-p, --plugin=<value>` · `-c, --command=<value>` · `-d, --output-dir=<value>` · `-i, --create-issue`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

---

## 13. Direct API

### `sf api request rest <endpoint>`
Send an authenticated REST API request.
Flags: `-o, --target-org=<value>` (required) · `-X, --method=<value>` (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) · `-H, --header=<value>...` · `-b, --body=<value>` (file or stdin) · `-S, --stream-to-file=<value>` · `-i, --include` · `--fail`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf api request graphql`
Send an authenticated GraphQL API request.
Flags: `-o, --target-org=<value>` (required) · `-b, --body=<value>` (required, file or stdin) · `-S, --stream-to-file=<value>` · `-i, --include`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
