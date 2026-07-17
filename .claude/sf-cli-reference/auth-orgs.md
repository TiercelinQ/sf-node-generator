# sf CLI v2 — Authentication, orgs & configuration

> `sf` v2 command catalog, sections §2-§4. Catalog version, conventions, and global flags: see `INDEX.md`.

## 2. Authentication & org authorization

### `sf org login web`
Log in via the web server flow.
Flags: `-b, --browser=<value>` · `-d, --set-default` · `-v, --set-default-dev-hub` · `-a, --alias=<value>` · `-r, --instance-url=<value>` · `-i, --client-id=<value>` · `--scopes=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org login jwt`
Log in via JWT (headless / CI).
Flags: `-u, --username=<value>` (required) · `-f, --jwt-key-file=<value>` (required) · `-i, --client-id=<value>` (required) · `-d, --set-default` · `-v, --set-default-dev-hub` · `-a, --alias=<value>` · `-r, --instance-url=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org login device`
Log in via the device flow (code).
Flags: `-i, --client-id=<value>` · `-d, --set-default` · `-v, --set-default-dev-hub` · `-a, --alias=<value>` · `-r, --instance-url=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org login access-token`
Authorize an org via an existing access token.
Flags: `-r, --instance-url=<value>` (required) · `-d, --set-default` · `-v, --set-default-dev-hub` · `-a, --alias=<value>` · `--no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org login sfdx-url`
Authorize an org via an SFDX Auth URL (file or stdin).
Flags: `-f, --sfdx-url-file=<value>` · `--sfdx-url-stdin` · `-d, --set-default` · `-v, --set-default-dev-hub` · `-a, --alias=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org logout`
Log out of one or more orgs.
Flags: `-o, --target-org=<value>` · `-a, --all` · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf org list auth`
List the orgs' authorization info.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org auth show-access-token`
Show the current access token.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf org auth show-sfdx-auth-url`
Show an org's SFDX Auth URL.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf org auth show-user-password`
Show a user's stored password.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### Aliases

### `sf alias set <alias>=<value>...`
Create/update one or more aliases.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf alias unset <alias>...`
Remove one or more aliases.
Flags: `-a, --all` · `-n, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf alias list`
List all aliases.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

---

## 3. Org management

### `sf org list`
List the orgs created or connected.
Flags: `--all` · `-p, --skip-connection-status` · `--clean` · `-n, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org display`
Show an org's info.
Flags: `-o, --target-org=<value>` (required) · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org display user`
Show a user's info.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org open`
Open the org in a browser.
Flags: `-o, --target-org=<value>` (required) · `-p, --path=<value>` · `-r, --url-only` · `-b, --browser=<value>` · `--private`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### Scratch orgs

### `sf org create scratch`
Create a scratch org.
Flags: `-f, --definition-file=<value>` · `-v, --target-dev-hub=<value>` (required) · `-a, --alias=<value>` · `-d, --set-default` · `-w, --wait=<value>` · `-y, --duration-days=<value>` · `-c, --no-ancestors` · `-e, --edition=<value>` · `--username=<value>` · `--description=<value>` · `--name=<value>` · `--release=<value>` · `--admin-email=<value>` · `--source-org=<value>` · `--snapshot=<value>` · `--track-source/--no-track-source` · `--client-id=<value>` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗ (uses --target-dev-hub)

### `sf org resume scratch`
Resume an incomplete scratch org creation.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf org delete scratch`
Delete a scratch org.
Flags: `-o, --target-org=<value>` (required) · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf org generate password`
Generate a password for scratch org users.
Flags: `-o, --target-org=<value>` (required) · `-l, --length=<value>` · `-c, --complexity=<value>` · `-n, --on-behalf-of=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### Sandboxes

### `sf org create sandbox`
Create a sandbox.
Flags: `-f, --definition-file=<value>` · `-o, --target-org=<value>` (prod, required) · `-a, --alias=<value>` · `-d, --set-default` · `-w, --wait=<value>` · `--async` · `-l, --license-type=<value>` · `-n, --name=<value>` · `-c, --clone=<value>` · `-i, --job-id=<value>` · `-r, --use-most-recent` · `--no-prompt` · `--no-track-source` · `--poll-interval=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org resume sandbox`
Check creation status and connect if ready.
Flags: `-o, --target-org=<value>` · `-n, --name=<value>` · `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `-l, --poll-interval=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org refresh sandbox`
Refresh a sandbox by its name.
Flags: `-o, --target-org=<value>` (prod) · `-f, --definition-file=<value>` · `-n, --name=<value>` · `-w, --wait=<value>` · `--async` · `--no-auto-activate` · `--no-prompt` · `--poll-interval=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org delete sandbox`
Delete a sandbox.
Flags: `-o, --target-org=<value>` (required) · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### Shapes

### `sf org create shape`
Create a shape based on a source org.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org list shape`
List the shapes created.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf org delete shape`
Delete all shapes of a target org.
Flags: `-o, --target-org=<value>` (required) · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### Snapshots (scratch)

### `sf org create snapshot`
Create a snapshot of a scratch org.
Flags: `-v, --target-dev-hub=<value>` (required) · `-o, --source-org=<value>` (required) · `-n, --name=<value>` (required) · `-d, --description=<value>` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗ (uses --target-dev-hub)

### `sf org get snapshot`
Snapshot details.
Flags: `-v, --target-dev-hub=<value>` (required) · `-s, --snapshot=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf org list snapshot`
List the snapshots.
Flags: `-v, --target-dev-hub=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf org delete snapshot`
Delete a snapshot.
Flags: `-v, --target-dev-hub=<value>` (required) · `-s, --snapshot=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### Change tracking

### `sf org enable tracking`
Enable source change tracking.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf org disable tracking`
Disable source change tracking.
Flags: `-o, --target-org=<value>` (required) · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### Metadata & limits inspection

### `sf org list metadata`
List the components of a metadata type.
Flags: `-o, --target-org=<value>` (required) · `-m, --metadata-type=<value>` (required) · `--folder=<value>` · `-f, --output-file=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org list metadata-types`
List the enabled metadata types.
Flags: `-o, --target-org=<value>` (required) · `-f, --output-file=<value>` · `--filter-known`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org list limits`
Show the org's limits.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org list sobject record-counts`
Record count per object.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org list users`
List the users authenticated locally.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

---

## 4. Configuration

### `sf config set <key>=<value>...`
Set a config variable.
Flags: `-g, --global` (global config instead of local).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf config get <key>...`
Read one or more variables.
Flags: `--verbose`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf config unset <key>...`
Remove one or more variables.
Flags: `-g, --global`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf config list`
List all variables.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

> Common variables: `target-org`, `target-dev-hub`, `org-api-version`, `org-instance-url`, `org-max-query-limit`, `org-isv-debugger-sid`, `disable-telemetry`.
