# sf CLI v2 — Recent plugins (Experience Cloud, Lightning Dev, Agentforce, Code Analyzer, Dev)

> `sf` v2 catalog (2.142.0, Summer '26). Sections §14-§19 extracted from the reference. Conventions and global flags: see `INDEX.md`.
> Recent plugins: globals + main flags shown. Confirm the exact detail with `sf <command> --help` (changes every release).

## 14. Communities / Experience Cloud

### `sf community create`
Create an Experience Cloud community.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>` (required) · `-t, --template-name=<value>` (required) · `-p, --url-path-prefix=<value>` · `-d, --description=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf community publish`
Publish a community.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf community list template`
List the available community templates.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

---

## 15. Local development (Lightning Dev)

### `sf lightning dev app`
Preview an app locally (hot reload).
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>` · `-t, --device-type=<value>` (desktop|ios|android) · `-i, --device-id=<value>`.
Globals: --json ✗ | --api-version ✗ | --target-org ✓

### `sf lightning dev component`
Preview a component locally.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>` · see `--help`.
Globals: --json ✗ | --api-version ✗ | --target-org ✓

### `sf lightning dev site`
Preview an Experience Cloud site locally.
Flags: `-o, --target-org=<value>` (required) · `-n, --name=<value>` · `--debug` · `-r, --get-latest` · see `--help`.
Globals: --json ✗ | --api-version ✗ | --target-org ✓

### `sf lightning lint <filepath>`
Static analysis of LWC code.
Flags: `--config=<value>` · `--fix` · `-e, --editor=<value>`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

---

## 16. Agentforce

> The `agent` plugin moves fast. Confirm the flag scope via `--help`.

### `sf agent create`
Create an agent in the org.
Flags: `-o, --target-org=<value>` (required) · `--spec=<value>` · `--name=<value>` · `--api-name=<value>` · `--agent-user=<value>` · `--preview`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent generate agent-spec`
Generate an agent specification.
Flags: `-o, --target-org=<value>` (required) · `--type=<value>` · `--role=<value>` · `--company-name=<value>` · `--company-description=<value>` · `--output-file=<value>` · `--max-topics=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent generate template`
Generate an agent template (from an existing agent).
Flags: `-o, --target-org=<value>` (required) · `--agent-version=<value>` · `--agent-file=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent generate test-spec`
Generate an agent test spec.
Flags: `-o, --target-org=<value>` · `--output-file=<value>` · `--force-overwrite`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent activate`
Activate an agent.
Flags: `-o, --target-org=<value>` (required) · `-n, --api-name=<value>` · `--version=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent deactivate`
Deactivate an agent.
Flags: `-o, --target-org=<value>` (required) · `-n, --api-name=<value>` · `--version=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent preview`
Test an agent in conversational mode.
Flags: `-o, --target-org=<value>` (required) · `-n, --api-name=<value>` (required) · `-c, --client-app=<value>` · `-x, --connected-app-user=<value>` · `-d, --output-dir=<value>` · `--apex-debug`.
Globals: --json ✗ | --api-version ✓ | --target-org ✓

### `sf agent test create`
Create an agent test definition.
Flags: `-o, --target-org=<value>` (required) · `--spec=<value>` · `--api-name=<value>` · `--force-overwrite` · `--preview`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent test run`
Run an agent's tests.
Flags: `-o, --target-org=<value>` (required) · `-n, --api-name=<value>` (required) · `-w, --wait=<value>` · `-r, --result-format=<value>` (human|json|junit|tap) · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent test resume`
Resume an agent test run.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` · `-r, --use-most-recent` · `-w, --wait=<value>` · `--result-format=<value>` · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent test results`
Get the test results.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` (required) · `--result-format=<value>` · `-d, --output-dir=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent test list`
List the agent tests.
Flags: `-o, --target-org=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent test cancel`
Cancel an agent test run.
Flags: `-o, --target-org=<value>` (required) · `-i, --job-id=<value>` · `-r, --use-most-recent`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent adl create`
Create an Agentforce Data Library.
Flags: `-o, --target-org=<value>` (required) · `--source-type=<value>` (sfdrive|knowledge|retriever) (required) · `--index-mode=<value>` (basic|enhanced) · `--retriever-id=<value>` · `--primary-index-field1=<value>` · `--primary-index-field2=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf agent adl file delete`
Delete a file from a Data Library.
Flags: `-o, --target-org=<value>` (required) · `-i, --library-id=<value>` (required) · `--file-id=<value>` (required).
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org open agent`
Open an agent in Agentforce Builder.
Flags: `-o, --target-org=<value>` (required) · `-n, --api-name=<value>` · `-r, --url-only` · `-b, --browser=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

### `sf org open authoring-bundle`
Open Agentforce Studio (agent list).
Flags: `-o, --target-org=<value>` (required) · `-r, --url-only` · `-b, --browser=<value>`.
Globals: --json ✓ | --api-version ✓ | --target-org ✓

---

## 17. Code quality (Code Analyzer v5)

### `sf code-analyzer run`
Run static analysis (PMD, ESLint, RetireJS, etc.).
Flags: `-w, --workspace=<value>...` · `-t, --rule-selector=<value>...` · `-c, --config-file=<value>` · `-f, --output-file=<value>...` · `-v, --view=<value>` (detail|table) · `--severity-threshold=<value>`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf code-analyzer rules`
List the available rules.
Flags: `-w, --workspace=<value>...` · `-t, --rule-selector=<value>...` · `-c, --config-file=<value>` · `-v, --view=<value>` (detail|table).
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf code-analyzer config`
Generate/show the configuration file.
Flags: `-w, --workspace=<value>...` · `-t, --rule-selector=<value>...` · `-c, --config-file=<value>` · `-f, --output-file=<value>`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

---

## 18. CLI plugin development

### `sf dev generate plugin`
Generate a new `sf` plugin.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev generate command`
Generate a command in a plugin.
Flags: `-n, --name=<value>` (required) · `-f, --force` · `--nuts` · `--unit`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev generate flag`
Add a flag to a command.
Flags: `-d, --dry-run`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev generate library`
Generate a shared library.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev audit messages`
Audit the `messages` folder (unused/missing).
Flags: `-p, --project-dir=<value>` · `-m, --messages-dir=<value>` · `-s, --source-dir=<value>`.
Globals: --json ✓ | --api-version ✗ | --target-org ✗

### `sf dev convert messages`
Convert message files to the up-to-date format.
Flags: `-p, --project-dir=<value>` · `--file-name=<value>...`.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev convert plugin`
Convert an sfdx plugin to sf.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev hook`
Run/test a plugin hook.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

### `sf dev configure-autocomplete`
Configure autocomplete in development.
Globals: --json ✗ | --api-version ✗ | --target-org ✗

---

## 19. Topics with undetailed scope

Installed plugins whose subcommands/flags vary heavily by version. Check via `sf <topic> --help`:
- `flow` (plugin-flow)
- `ui-bundle-dev` (plugin-ui-bundle-dev): Agentforce UI bundle development
- `marketplace` (plugin-marketplace): plugin discovery/installation, extends `sf plugins`
- `signups` (plugin-signups): Trialforce/scratch provisioning (underlies `org create snapshot`/`shape`)
