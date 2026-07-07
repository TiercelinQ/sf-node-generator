# sf CLI v2 — Users, permissions, schema & sObjects

> `sf` v2 catalog (2.142.0, Summer '26). Sections §10-§11 extracted from the reference. Conventions and global flags: see `INDEX.md`.

## 10. Users & permissions

### `sf org create user`
Create a user for a scratch org.
Flags: `-o, --target-org=<value>` (required) · `-f, --definition-file=<value>` · `-a, --set-alias=<value>` · `-b, --set-unique-username` · ad hoc `key=value` values.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org create agent-user`
Create the default run-as user for an agent.
Flags: `-o, --target-org=<value>` (required) · `-f, --definition-file=<value>` · see `--help`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org assign permset`
Assign a permission set to users.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>...` (required) · `-b, --on-behalf-of=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org assign permsetlicense`
Assign a permission set license.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>...` (required) · `-b, --on-behalf-of=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user create`
Create and configure a user.
Flags: `-o, --target-org=<value>` (required) · `-f, --definition-file=<value>` · `-a, --set-alias=<value>` · `key=value` values.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user display`
Show a user's info.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user list`
List an org's users.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user password generate`
Generate a password for a user.
Flags: `-o, --target-org=<value>` (required) · `-b, --on-behalf-of=<value>...` · `-l, --length=<value>` · `-c, --complexity=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user permset assign`
Assign a permission set (plugin-user).
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>...` (required) · `-b, --on-behalf-of=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf user permsetlicense assign`
Assign a permission set license (plugin-user).
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>...` (required) · `-b, --on-behalf-of=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

---

## 11. Schema, sObjects & custom metadata

### `sf schema generate sobject`
Generate a custom object.
Flags: `-l, --label=<value>` (required) · `-d, --output-dir=<value>` · `--plural-label=<value>` · `--api-name=<value>` · `--type=<value>` (default|platform-event|custom-metadata-type|big-object) · `--description=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf schema generate field`
Generate a custom field.
Flags: `-l, --label=<value>` (required) · `-o, --object=<value>` (required, .object-meta.xml file) · `--api-name=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf schema generate tab`
Generate a custom tab.
Flags: `-o, --object=<value>` (required) · `-d, --directory=<value>` (required) · `-i, --icon=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf schema generate platformevent`
Generate a Platform Event.
Flags: `-l, --label=<value>` (required) · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf sobject describe`
Describe an object.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-t, --use-tooling-api`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf sobject list`
List the org's objects.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (all|custom|standard).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf cmdt generate object`
Generate a custom metadata type.
Flags: `-n, --type-name=<value>` (required) · `-l, --label=<value>` · `-p, --plural-label=<value>` · `-v, --visibility=<value>` (PackageProtected|Protected|Public) · `-d, --output-directory=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf cmdt generate field`
Generate a CMDT field.
Flags: `-n, --name=<value>` (required) · `-f, --field-type=<value>` (required) · `-l, --label=<value>` · `-o, --output-directory=<value>` · options depending on the type (picklist, etc.).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf cmdt generate records`
Generate CMDT records from an sObject/CSV.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-t, --type-name=<value>` · `-d, --output-dir=<value>` · `-x, --name-column=<value>` · `-i, --ignore-unsupported`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
