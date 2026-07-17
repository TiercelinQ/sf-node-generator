# sf CLI v2 — Packaging (2GP & 1GP)

> `sf` v2 command catalog, section §9. Catalog version, conventions, and global flags: see `INDEX.md`.

## 9. Packaging (2GP & 1GP)

### `sf package create`
Create a package (Unlocked or Managed).
Flags: `-v, --target-dev-hub=<value>` (required) · `-n, --name=<value>` (required) · `-t, --package-type=<value>` (Managed|Unlocked) (required) · `-d, --description=<value>` · `-r, --path=<value>` (required) · `-e, --no-namespace` · `--org-dependent`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗ (Dev Hub)

### `sf package update`
Update a package's properties.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `-n, --name=<value>` · `-d, --description=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package delete`
Delete a package.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `-n, --no-prompt` · `--undelete`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package list`
List the Dev Hub's packages.
Flags: `-v, --target-dev-hub=<value>` (required) · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package install`
Install a package version into an org.
Flags: `-o, --target-org=<value>` (required) · `-p, --package=<value>` (required) · `-w, --wait=<value>` · `-b, --publish-wait=<value>` · `-k, --installation-key=<value>` · `-r, --no-prompt` · `-a, --apex-compile=<value>` (all|package) · `-s, --security-type=<value>` (AllUsers|AdminsOnly) · `-t, --upgrade-type=<value>` (DeprecateOnly|Mixed|Delete) · `--skip-handlers=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package install report`
Status of an installation.
Flags: `-o, --target-org=<value>` (required) · `-i, --request-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package installed list`
List the packages installed in an org.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package uninstall`
Uninstall a package from an org.
Flags: `-o, --target-org=<value>` (required) · `-p, --package=<value>` (required) · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package uninstall report`
Status of an uninstall.
Flags: `-o, --target-org=<value>` (required) · `-i, --request-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package version create`
Create a package version.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` · `-d, --path=<value>` · `-f, --definition-file=<value>` · `-k, --installation-key=<value>` · `-x, --installation-key-bypass` · `-w, --wait=<value>` · `-c, --code-coverage` · `--skip-validation` · `-n, --version-number=<value>` · `-a, --version-name=<value>` · `-e, --version-description=<value>` · `-t, --tag=<value>` · `-b, --branch=<value>` · `--async-validation` · `--skip-ancestor-check` · `--post-install-script=<value>` · `--post-install-url=<value>` · `--uninstall-script=<value>` · `--releasenotes-url=<value>` · `--language=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version create list`
List the version creation requests.
Flags: `-v, --target-dev-hub=<value>` (required) · `-c, --created-last-days=<value>` · `-s, --status=<value>` (Queued|InProgress|Success|Error) · `--show-conversions-only`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version create report`
Status of a version creation.
Flags: `-v, --target-dev-hub=<value>` (required) · `-i, --package-create-request-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version list`
List the package versions.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --packages=<value>...` · `-c, --created-last-days=<value>` · `-m, --modified-last-days=<value>` · `--concise` · `--released` · `-o, --order-by=<value>` · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version report`
Details of a version.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version update`
Update a version.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `-a, --version-name=<value>` · `-e, --version-description=<value>` · `-b, --branch=<value>` · `-t, --tag=<value>` · `-k, --installation-key=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version promote`
Promote a version to released.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `-n, --no-prompt`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version delete`
Delete a version.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `-n, --no-prompt` · `--undelete`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package version displayancestry`
Show the versions' ancestry tree.
Flags: `-v, --target-dev-hub=<value>` (required) · `-p, --package=<value>` (required) · `--dot-code` · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf package1 version create`
Create a 1GP package version.
Flags: `-o, --target-org=<value>` (required) · `-i, --package-id=<value>` (required) · `-n, --name=<value>` (required) · `-d, --description=<value>` · `-v, --version=<value>` · `-m, --managed-released` · `-r, --release-notes-url=<value>` · `-p, --post-install-url=<value>` · `-k, --installation-key=<value>` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package1 version create get`
Status of a 1GP creation.
Flags: `-o, --target-org=<value>` (required) · `-i, --request-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package1 version display`
Details of a 1GP version.
Flags: `-o, --target-org=<value>` (required) · `-i, --package-version-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf package1 version list`
List the 1GP versions.
Flags: `-o, --target-org=<value>` (required) · `-i, --package-id=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
