# Output formatters — sf-node CLI tool

> Every user-facing dataset goes through the **`output/` layer** — one dispatch, `formatOutput(rows, { format, destination })`, with `format: "json" | "csv" | "xlsx" | "table"` and `destination: { kind: "stdout" } | { kind: "file"; path: string }`. **No ad-hoc `console.log(JSON.stringify(...))` in a command.** A command gets typed rows from a service, then hands them to `formatOutput` — the only place a dataset is serialized.

The layering (`@rules/architecture.md`) is `commands` → `services` → `sf` + `output`. Services return data (`Result<T>`); **commands** format it through `output/`; **services never format**. Data goes to `stdout`, logs go to `stderr` (`@rules/cli.md`).

## Files

| File | Role |
| ---- | ---- |
| `src/output/index.ts` | The dispatch `formatOutput(...)` + the shared output types. |
| `src/output/json.ts` | Stable JSON (2-space) to stdout or a file. |
| `src/output/csv.ts` | CSV via `csv-stringify` — header from keys, streaming-friendly. |
| `src/output/xlsx.ts` | xlsx via `exceljs` — a native Excel table (ListObject) with autofit columns. **Requires a file destination.** |
| `src/output/table.ts` | Aligned console table for human reading — no dependency, a small manual column formatter. |

## Dispatch — `src/output/index.ts`

```ts
import type { Result } from "../types";
import { toJson } from "./json";
import { toCsv } from "./csv";
import { toXlsx } from "./xlsx";
import { toTable } from "./table";

export type OutputFormat = "json" | "csv" | "xlsx" | "table";
export type OutputDestination = { kind: "stdout" } | { kind: "file"; path: string };
export interface OutputOptions { format: OutputFormat; destination: OutputDestination; }
export type Row = Record<string, unknown>;

/** Single entry point for every user-facing dataset. Returns Result — the command maps a failure to an exit code. */
export async function formatOutput(rows: Row[], opts: OutputOptions): Promise<Result<void>> {
  switch (opts.format) {
    case "json":  return toJson(rows, opts.destination);
    case "csv":   return toCsv(rows, opts.destination);
    case "xlsx":  return toXlsx(rows, opts.destination);   // enforces a file destination
    case "table": return toTable(rows, opts.destination);
  }
}
```

The writers return `Result<void>` so an invalid request (xlsx to stdout, a file write error) becomes a `Result` error the command maps to `stderr` + a non-zero exit code (`@rules/errors.md`, `@rules/cli.md`) — never a thrown exception reaching the user.

## JSON — `src/output/json.ts`

```ts
import { writeFile } from "node:fs/promises";
import type { Result } from "../types";
import type { OutputDestination, Row } from "./index";   // type-only import — erased, no runtime cycle

export async function toJson(rows: Row[], dest: OutputDestination): Promise<Result<void>> {
  const text = JSON.stringify(rows, null, 2) + "\n";   // 2-space; key order follows the source records (SOQL field order)
  try {
    if (dest.kind === "file") await writeFile(dest.path, text, "utf8");
    else process.stdout.write(text);                   // data → stdout (@rules/cli.md)
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: { kind: "error", message: "Échec de l'écriture JSON.", detail: (e as Error).message } };
  }
}
```

## CSV — `src/output/csv.ts`

```ts
import { stringify } from "csv-stringify";
import { createWriteStream } from "node:fs";
import type { Result } from "../types";
import type { OutputDestination, Row } from "./index";

export function toCsv(rows: Row[], dest: OutputDestination): Promise<Result<void>> {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];   // header from the first row's keys
  const stringifier = stringify({ header: true, columns });
  return new Promise((resolve) => {
    const ok = (): void => resolve({ ok: true, data: undefined });
    const fail = (e: Error): void => resolve({ ok: false, error: { kind: "error", message: "Échec de l'écriture CSV.", detail: e.message } });
    stringifier.on("error", fail);
    if (dest.kind === "file") {
      const file = createWriteStream(dest.path);
      file.on("error", fail).on("finish", ok);
      stringifier.pipe(file);                        // pipe ends the file stream
    } else {
      stringifier.pipe(process.stdout, { end: false });   // never close stdout
      stringifier.on("end", ok);
    }
    for (const row of rows) stringifier.write(row);   // streaming-friendly: the same stringifier accepts a row stream
    stringifier.end();
  });
}
```

## XLSX — `src/output/xlsx.ts`

The workbook renders the data as a **native Excel table** (a ListObject via `addTable`: header row, filter buttons, banded rows) and **autofits each column** to the longest of its header and its cell values (bounded by `MIN_WIDTH`..`MAX_WIDTH`). A binary workbook cannot go to stdout, so a **file destination is required**.

```ts
import ExcelJS from "exceljs";
import type { Result } from "../types";
import type { OutputDestination, Row } from "./index";

const MIN_WIDTH = 10; // keep narrow columns readable
const MAX_WIDTH = 60; // cap very long cells so the sheet stays usable
const PADDING = 2;    // a little breathing room beyond the longest value

export async function toXlsx(rows: Row[], dest: OutputDestination): Promise<Result<void>> {
  if (dest.kind !== "file") {   // a binary workbook cannot go to stdout — enforce a file destination
    return { ok: false, error: {
      kind: "error",
      message: "Le format xlsx exige une destination fichier (--output <chemin>).",
      detail: "Un classeur binaire ne peut pas être écrit sur stdout.",
    } };
  }
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Export");

  if (columns.length === 0) {
    sheet.addRow(["(0 rows)"]);            // no data → placeholder cell (addTable needs ≥ 1 column)
  } else {
    // Data as a native Excel table (ListObject): header row + filter buttons + banded rows.
    sheet.addTable({
      name: "Export",
      ref: "A1",
      headerRow: true,
      style: { theme: "TableStyleMedium2", showRowStripes: true },
      columns: columns.map((name) => ({ name, filterButton: true })),
      rows: rows.map((row) => columns.map((c) => row[c] ?? null)),
    });
    // Autofit each column to the longest of its header and its cell values (bounded).
    columns.forEach((header, i) => {
      let max = header.length;
      for (const row of rows) {
        const v = row[header];
        const len = v == null ? 0 : String(v).length;
        if (len > max) max = len;
      }
      sheet.getColumn(i + 1).width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, max + PADDING));
    });
  }

  try {
    await workbook.xlsx.writeFile(dest.path);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: { kind: "error", message: "Échec de l'écriture du classeur xlsx.", detail: (e as Error).message } };
  }
}
```

- **Native table, not a plain grid**: `addTable` writes a ListObject (`TableStyleMedium2`, filter buttons, banded rows) so the export opens as a real Excel table. `getColumn(i + 1).width` autofits each column — exceljs has no true auto-width, so the width is computed from the string lengths of the header and the cells (capped `MIN_WIDTH`..`MAX_WIDTH`).
- **Empty result**: with no rows there are no columns; skip `addTable` (a table needs at least one column) and write a `(0 rows)` placeholder cell.

## Table — `src/output/table.ts`

```ts
import type { Result } from "../types";
import type { OutputDestination, Row } from "./index";

const MAX_CELL = 40;   // truncate wide cells so the table stays readable

/** Human-facing rendering of the same data. No dependency — a small manual column formatter. */
export function toTable(rows: Row[], _dest: OutputDestination): Result<void> {
  if (rows.length === 0) { process.stdout.write("(0 rows)\n"); return { ok: true, data: undefined }; }
  const columns = Object.keys(rows[0]);
  const cell = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.length > MAX_CELL ? s.slice(0, MAX_CELL - 1) + "…" : s;
  };
  const widths = columns.map((c) => Math.max(c.length, ...rows.map((r) => cell(r[c]).length)));
  const line = (cells: string[]): string => cells.map((s, i) => s.padEnd(widths[i])).join("  ");
  const body = rows.map((r) => line(columns.map((c) => cell(r[c]))));
  const out = [line(columns), line(widths.map((w) => "-".repeat(w))), ...body].join("\n") + "\n";
  process.stdout.write(out);   // the table is the selected data format → still stdout; logs go to stderr (@rules/cli.md)
  return { ok: true, data: undefined };
}
```

- `table` is a human view, not meant for piping; it still writes to `stdout` because it is the chosen **data** format (only logs go to `stderr`, `@rules/cli.md`). It uses **no table library** — a heavy dependency is unwarranted for aligned columns.

## Large result sets

- Prefer **streaming** for big SOQL exports: `csv-stringify` consumes a row stream (pipe the source into the stringifier), and `exceljs` offers a streaming writer — `new ExcelJS.stream.xlsx.WorkbookWriter({ filename })` — that flushes rows to disk instead of buffering the whole workbook.
- The native `addTable` rendering uses the **in-memory** workbook. The **streaming writer does not support `addTable`** (a ListObject needs the full workbook), so a streamed xlsx is a header + rows grid with column widths, not a native table — use it only for very large datasets, accepting that trade-off.
- `json` and `table` buffer in memory — fine for small/medium sets; for very large exports choose `csv` or `xlsx` **to a file**.
- Server-side pagination beats in-memory paging: for big datasets use the `bulkExport` helper (`sf data export bulk`, `@rules/sf-cli.md`) rather than a single `query`. The **`pageSize`** config key bounds interactive queries; **`exportDir`** is the default output directory for file destinations (`@rules/config.md`).

## Cross-references

- **`@rules/cli.md`** — the `--format` and `--output` flags map to `{ format, destination }`: no `--output` → `{ kind: "stdout" }`, `--output <path>` → `{ kind: "file"; path }`. `stdout` carries data (pipeable), `stderr` carries logs.
- **`@rules/config.md`** — `exportDir` (default directory for file output), `pageSize` (query page size).

## Anti-patterns — what NOT to do

- **Do not** serialize a dataset with `console.log(JSON.stringify(...))` in a command — call `formatOutput(...)`; `output/` is the single dispatch.
- **Do not** send `xlsx` to stdout — it requires a file destination; the writer returns a `Result` error otherwise.
- **Do not** add a heavy table dependency (`cli-table3`…) — the manual column formatter covers the console table.
- **Do not** format inside a service — services return data (`Result<T>`); commands format. Keep serialization out of the business layer.
- **Do not** call `.end()` on `process.stdout` (pipe with `{ end: false }`) — closing stdout breaks piping and later writes.
- **Do not** hand-roll CSV escaping — use `csv-stringify`.

## Integrity verification

Detailed in `@rules/verification.md`. Key points: every user-facing dataset goes through `formatOutput(...)` (no `console.log(JSON.stringify(...))` in `commands/`); `xlsx` rejects a non-file destination and renders a native Excel table (`addTable`) with autofit column widths; `csv` uses `csv-stringify` and never closes `stdout`; `table` has no external dependency and truncates wide cells; formatting lives in `output/` only (never in a service); `csv-stringify ^6.8.1` and `exceljs ^4.4.0` in `dependencies`; `--format` / `--output` map to `{ format, destination }` (`@rules/cli.md`).
