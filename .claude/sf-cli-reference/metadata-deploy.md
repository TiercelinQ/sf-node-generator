# sf CLI v2 — Deployment, retrieval & component generation

> `sf` v2 command catalog, sections §5-§6. Catalog version, conventions, and global flags: see `INDEX.md`.

## 5. Metadata deployment & retrieval

### `sf project deploy start`
Deploy metadata to an org.
Flags: `-o, --target-org=<value>` (required) · `-d, --source-dir=<value>...` · `-m, --metadata=<value>...` · `-x, --manifest=<value>` · `--metadata-dir=<value>` · `-c, --ignore-conflicts` · `-g, --ignore-warnings` · `-l, --test-level=<value>` (NoTestRun|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg) · `-t, --tests=<value>...` · `-w, --wait=<value>` · `--async` · `-r, --dry-run` · `--concise` · `--verbose` · `--coverage-formatters=<value>...` · `--results-dir=<value>` · `--junit` · `--pre-destructive-changes=<value>` · `--post-destructive-changes=<value>` · `--purge-on-delete` · `-a, --api-version=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project deploy validate`
Validation only (dry run, a quick deploy is possible afterwards).
Flags: same as `deploy start`; `-l, --test-level` requires RunSpecifiedTests, RunLocalTests, or RunAllTestsInOrg.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project deploy quick`
Quickly deploy an already-validated deployment.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `--async` · `--concise` · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project deploy preview`
Preview the deployment (components, conflicts, ignored).
Flags: `-o, --target-org=<value>` (required) · `-d, --source-dir=<value>...` · `-m, --metadata=<value>...` · `-x, --manifest=<value>` · `-c, --ignore-conflicts` · `--concise`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project deploy resume`
Resume an in-progress deployment.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `--concise` · `--verbose` · `--coverage-formatters=<value>...` · `--results-dir=<value>` · `--junit`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf project deploy report`
Status of a deployment.
Flags: `-o, --target-org=<value>` · `-i, --job-id=<value>` · `-r, --use-most-recent` · `--coverage-formatters=<value>...` · `--results-dir=<value>` · `--junit`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf project deploy cancel`
Cancel an in-progress deployment.
Flags: `-o, --target-org=<value>` · `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `--async`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf project retrieve start`
Retrieve metadata into the local project.
Flags: `-o, --target-org=<value>` (required) · `-d, --source-dir=<value>...` · `-m, --metadata=<value>...` · `-x, --manifest=<value>` · `-c, --ignore-conflicts` · `-n, --package-name=<value>...` · `-r, --output-dir=<value>` · `-t, --target-metadata-dir=<value>` · `-z, --zip-file-name=<value>` · `--unzip` · `-w, --wait=<value>` · `-a, --api-version=<value>` · `--single-package`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project retrieve preview`
Preview the retrieval (conflicts, ignored).
Flags: `-o, --target-org=<value>` (required) · `--concise` · `--ignore-conflicts`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project convert source`
Convert source format to metadata format.
Flags: `-r, --root-dir=<value>` · `-d, --output-dir=<value>` · `-n, --package-name=<value>` · `-x, --manifest=<value>` · `-p, --source-dir=<value>...` · `-m, --metadata=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf project convert mdapi`
Convert metadata format to source format.
Flags: `-r, --root-dir=<value>` (required) · `-d, --output-dir=<value>` · `-x, --manifest=<value>` · `-p, --metadata-dir=<value>...` · `-m, --metadata=<value>...`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf project convert source-behavior` (Beta)
Enable a source file behavior.
Flags: `-b, --behavior=<value>` (required) · `--dry-run` · `--preserve-temp-dir`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf project delete source`
Delete from the project source and from a non-tracked org.
Flags: `-o, --target-org=<value>` (required) · `-d, --source-dir=<value>...` · `-m, --metadata=<value>...` · `-r, --no-prompt` · `-c, --ignore-conflicts` · `-w, --wait=<value>` · `-l, --test-level=<value>` · `-t, --tests=<value>...` · `--track-source` · `--force-overwrite` · `--verbose`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project delete tracking`
Delete the local tracking info.
Flags: `-o, --target-org=<value>` (required) · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project reset tracking`
Reset local and remote tracking.
Flags: `-o, --target-org=<value>` (required) · `-r, --revision=<value>` · `-p, --no-prompt`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf project generate manifest`
Generate a manifest (package.xml).
Flags: `-m, --metadata=<value>...` · `-p, --source-dir=<value>...` · `-n, --name=<value>` · `-t, --type=<value>` (pre|post|destroy) · `-c, --include-packages=<value>...` · `-d, --output-dir=<value>` · `--from-org=<value>` · `--api-version=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✗

### `sf project list ignored`
List the files excluded by `.forceignore`.
Flags: `-p, --source-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### DevOps Center pipeline

### `sf project deploy pipeline start`
Deploy from a branch to the pipeline stage's org.
Flags: `-c, --devops-center-project-name=<value>` (required) · `-b, --branch-name=<value>` (required) · `-l, --deploy-all` · `--test-level=<value>` · `-w, --wait=<value>` · `--async` · `-o, --target-org=<value>` (DevOps Center org).
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf project deploy pipeline resume`
Resume a pipeline deployment.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `-o, --target-org=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf project deploy pipeline validate` (Beta)
Validation only from a branch to the stage.
Flags: `-c, --devops-center-project-name=<value>` (required) · `-b, --branch-name=<value>` (required) · `--test-level=<value>` · `-w, --wait=<value>` · `--async` · `-o, --target-org=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

### `sf project deploy pipeline quick`
Quick deploy of a pipeline validation.
Flags: `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `-o, --target-org=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✓

---

## 6. Project & component generation

### `sf project generate`
Create a Salesforce DX project.
Flags: `-n, --name=<value>` (required) · `-t, --template=<value>` (standard|empty|analytics) · `-d, --output-dir=<value>` · `-x, --manifest` · `-s, --namespace=<value>` · `-l, --login-url=<value>` · `--default-package-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf apex generate class`
Generate an Apex class.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>` (DefaultApexClass|ApexException|ApexUnitTest|InboundEmailService).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf apex generate trigger`
Generate an Apex trigger.
Flags: `-n, --name=<value>` (required) · `-s, --sobject=<value>` · `-e, --event=<value>...` (before insert, after update, etc.) · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf lightning generate component`
Generate an Aura or LWC component.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `--type=<value>` (aura|lwc) · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf lightning generate app`
Generate an Aura app.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf lightning generate event`
Generate an Aura event.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf lightning generate interface`
Generate an Aura interface.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf lightning generate test`
Generate a Jest test for an LWC.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf visualforce generate component`
Generate a Visualforce component.
Flags: `-n, --name=<value>` (required) · `-l, --label=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf visualforce generate page`
Generate a Visualforce page.
Flags: `-n, --name=<value>` (required) · `-l, --label=<value>` (required) · `-d, --output-dir=<value>` · `-t, --template=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf static-resource generate`
Generate a static resource.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>` · `--type=<value>` (content type).
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf analytics generate template`
Generate a CRM Analytics template.
Flags: `-n, --name=<value>` (required) · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗
