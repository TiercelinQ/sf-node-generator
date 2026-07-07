# sf CLI v2 — Data (SOQL/SOSL, CRUD, Bulk, Tree)

> `sf` v2 catalog (2.142.0, Summer '26). Section §8 extracted from the reference. Conventions and global flags: see `INDEX.md`.

## 8. Data

### `sf data query`
Run a SOQL query.
Flags: `-o, --target-org=<value>` (required) · `-q, --query=<value>` · `-f, --file=<value>` · `-w, --wait=<value>` (bulk mode) · `-r, --result-format=<value>` (human|csv|json) · `-t, --use-tooling-api` · `-b, --bulk` · `--all-rows` · `--output-file=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data search`
Run a SOSL query.
Flags: `-o, --target-org=<value>` (required) · `-q, --query=<value>` · `-f, --file=<value>` · `-r, --result-format=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data get record`
Get a single record.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-i, --record-id=<value>` · `-w, --where=<value>...` · `-t, --use-tooling-api`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data create record`
Create a record.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-v, --values=<value>` (required) · `-t, --use-tooling-api`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data update record`
Update a record.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-i, --record-id=<value>` · `-w, --where=<value>...` · `-v, --values=<value>` (required) · `-t, --use-tooling-api`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data delete record`
Delete a record.
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-i, --record-id=<value>` · `-w, --where=<value>...` · `-t, --use-tooling-api`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data resume`
Status of a load job/batch.
Flags: `-i, --batch-id=<value>` · `-b, --job-id=<value>` (required).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data import bulk`
Bulk import from CSV (Bulk API 2.0).
Flags: `-o, --target-org=<value>` (required) · `-f, --file=<value>` (required) · `-s, --sobject=<value>` (required) · `-w, --wait=<value>` · `--column-delimiter=<value>` · `--line-ending=<value>` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data import resume`
Resume a bulk import.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data export bulk`
Bulk export via SOQL to a file (Bulk API 2.0).
Flags: `-o, --target-org=<value>` (required) · `-q, --query=<value>` · `--query-file=<value>` · `--output-file=<value>` (required) · `-r, --result-format=<value>` (csv|json) · `-w, --wait=<value>` · `--column-delimiter=<value>` · `--line-ending=<value>` · `--all-rows` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data export resume`
Resume a bulk export.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data update bulk`
Bulk update from CSV (Bulk API 2.0).
Flags: `-o, --target-org=<value>` (required) · `-f, --file=<value>` (required) · `-s, --sobject=<value>` (required) · `-w, --wait=<value>` · `--column-delimiter=<value>` · `--line-ending=<value>` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data update resume`
Resume a bulk update.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data upsert bulk`
Bulk upsert from CSV (Bulk API 2.0).
Flags: `-o, --target-org=<value>` (required) · `-f, --file=<value>` (required) · `-s, --sobject=<value>` (required) · `-i, --external-id=<value>` (required) · `-w, --wait=<value>` · `--column-delimiter=<value>` · `--line-ending=<value>` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data upsert resume`
Resume a bulk upsert.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data delete bulk`
Bulk delete from CSV (Bulk API 2.0).
Flags: `-o, --target-org=<value>` (required) · `-f, --file=<value>` (required) · `-s, --sobject=<value>` (required) · `--hard-delete` · `-w, --wait=<value>` · `--column-delimiter=<value>` · `--line-ending=<value>` · `--async`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data delete resume`
Resume a bulk delete.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf data bulk results`
Results of an already-run bulk ingest job.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data export tree`
Export to JSON files (sObject tree format).
Flags: `-o, --target-org=<value>` (required) · `-q, --query=<value>` (required) · `-p, --plan` · `-x, --prefix=<value>` · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf data import tree`
Import from JSON files (with or without a plan).
Flags: `-o, --target-org=<value>` (required) · `-f, --files=<value>...` · `-p, --plan=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### Legacy (Bulk API 1.0)

### `sf force data bulk upsert`
Bulk upsert (Bulk API 1.0).
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-f, --file=<value>` (required) · `-i, --external-id=<value>` (required) · `-w, --wait=<value>` · `-r, --serial`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf force data bulk delete`
Bulk delete (Bulk API 1.0).
Flags: `-o, --target-org=<value>` (required) · `-s, --sobject=<value>` (required) · `-f, --file=<value>` (required) · `-w, --wait=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf force data bulk status`
Status of a Bulk API 1.0 job.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` (required) · `-b, --batch-id=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓
