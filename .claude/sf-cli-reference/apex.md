# sf CLI v2 — Apex & Logic

> `sf` v2 catalog (2.142.0, Summer '26). Section §7 extracted from the reference. Conventions and global flags: see `INDEX.md`.

## 7. Apex & Logic

### `sf apex run`
Run anonymous Apex code.
Flags: `-o, --target-org=<value>` (required) · `-f, --file=<value>` (reads from a file, otherwise stdin).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf apex run test`
Run Apex tests.
Flags: `-o, --target-org=<value>` (required) · `-n, --class-names=<value>...` · `-s, --suite-names=<value>...` · `-t, --tests=<value>...` · `-l, --test-level=<value>` (RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests) · `-c, --code-coverage` · `-r, --result-format=<value>` (human|tap|junit|json) · `-d, --output-dir=<value>` · `-w, --wait=<value>` · `-y, --synchronous` · `--concise` · `--detailed-coverage` · `--test-run-coverage`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf apex get test`
Get the results of a test run.
Flags: `-o, --target-org=<value>` (required) · `-i, --test-run-id=<value>` (required) · `-c, --code-coverage` · `-r, --result-format=<value>` · `-d, --output-dir=<value>` · `--concise` · `--detailed-coverage`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf apex get log`
Get one or more debug logs.
Flags: `-o, --target-org=<value>` (required) · `-i, --log-id=<value>` · `-n, --number=<value>` · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf apex list log`
List the available debug logs.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf apex tail log`
Stream debug logs live.
Flags: `-o, --target-org=<value>` (required) · `-c, --color` · `-d, --debug-level=<value>` · `-s, --skip-trace-flag`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf logic run test`
Run business logic tests.
Flags: `-o, --target-org=<value>` (required) · additional flags: see `--help`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
> Recent `logic` topic; confirm the flag scope via `--help`.

### `sf logic get test`
Get the results of logic tests.
Flags: `-o, --target-org=<value>` (required) · see `--help`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
