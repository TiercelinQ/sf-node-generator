# SF error reference — Apex, DML, limits, compilation (interpretation)

> Binding reference for **interpreting Salesforce errors surfaced by `sf`** — an `sf apex run` failure, a DML `StatusCode`, a `LimitException`, or a compile error returned by a deploy/save. Part of the `sf-cli-reference/` catalog: **loaded on demand, by section, never whole**.
> Use it to turn a raw Salesforce error name/code into a clear `Result` `message`; keep the raw code in `detail` for the log (`@rules/errors.md`). Route here from `@rules/sf-cli.md` whenever an `sf` result carries an Apex/DML/limit/compile error.
> This file is a **reference table**, not a command-syntax file — the `Globals:` convention of the command sections (INDEX §Reading convention) does not apply here. For the Apex *commands* (run anonymous Apex, run tests, logs) see `apex.md`.
> Source: Apex Reference Guide (Summer '26, API 67.0) + SOAP/REST API Developer Guide. Updated: 2026-07-01.

This document covers 5 families:
1. Runtime exceptions in the `System` namespace (complete official list)
2. Runtime exceptions in other namespaces
3. `System.StatusCode` codes returned by DML operations (including `FIELD_CUSTOM_VALIDATION_EXCEPTION`)
4. Governor limit errors (`LimitException`)
5. Common compilation errors

**Note on StatusCodes.** The `System.StatusCode` enum contains ~150 values generated in each org's own WSDL (`Enterprise WSDL`). Section 3 lists the DML codes actually encountered from Apex, not the internal or rare ones. The exhaustive list is in your org's WSDL (Setup > API).

**Reminder.** Built-in exceptions can only be caught, not thrown. To raise a business error, extend `Exception` (custom exception). A `LimitException` and a failed `System.assert` are not catchable.

---

## 1. Runtime exceptions — `System` namespace

Complete official list (Apex Reference Guide).

| Exception | Explanation |
|---|---|
| `Exception` | Base class of all exceptions. Used as the generic type in a `catch (Exception e)`. |
| `AssertException` | Failure of a `System.assert` / `Assert.*`. Halts execution. Not catchable. Carries the optional message passed to `assert()`. |
| `AuraException` | Inherited (legacy) Aura exception. Use `AuraHandledException` instead. |
| `AuraHandledException` | Returns a clean error message to a JS controller (Lightning/LWC). Hides the stack trace from the client. |
| `AsyncException` | Problem on an asynchronous operation: failure to enqueue an async call (`System.enqueueJob`, `@future`, batch). |
| `BigObjectException` | Problem on Big Objects: connection timeout on access or insertion. |
| `CalloutException` | Problem on a web service callout (HTTP/SOAP): connection failure, timeout, endpoint not allowed (Remote Site Settings). |
| `DataWeaveScriptException` | Runtime error in a DataWeave script run from Apex. |
| `DmlException` | Problem on a DML statement (`insert`/`update`/`delete`/`upsert`): missing required field, validation, duplicate rule, etc. See section 3 for the detail via `getDmlType()`. |
| `DuplicateMessageException` | Attempt to enqueue a Queueable job with a duplicate signature (deduplication). |
| `EmailException` | Email sending problem: delivery failure, limit reached, invalid address. |
| `ExternalObjectException` | Problem on external objects (Salesforce Connect): timeout accessing the external system's data. |
| `FatalCursorException` | Fatal problem on an Apex cursor within a transaction (non-recoverable). |
| `FinalException` | Attempt to mutate a read-only collection/record (an sObject in an after-update trigger) or a `final` variable. Halts execution. |
| `FlowException` | Problem starting a Flow interview from Apex: no active version found, or the flow cannot be started from Apex. |
| `HandledException` | Generic already-handled exception. |
| `IllegalArgumentException` | Illegal argument passed to a method (e.g. `null` for a non-nullable parameter). |
| `InvalidHeaderException` | Illegal header supplied to an Apex REST call (e.g. a header named `cookie`). |
| `InvalidParameterValueException` | Visualforce: invalid parameter or URL problem. Salesforce Functions: incorrect `functionName` format. |
| `LimitException` | Governor limit exceeded (SOQL, DML, CPU, heap, callouts…). Not catchable. See section 4. |
| `JSONException` | JSON serialization/deserialization problem (`System.JSON`, `JSONParser`, `JSONGenerator`): malformed JSON, unexpected structure. |
| `ListException` | Problem on a List: out-of-bounds index access, invalid operation. |
| `MathException` | Problem on a math operation: division by zero. |
| `NoAccessException` | Unauthorized access: attempt to access an sObject without permission. Used with Visualforce. |
| `NoDataFoundException` | Visualforce: non-existent data (deleted sObject). Functions: project/function not found. |
| `NoSuchElementException` | Out-of-bounds access via an `Iterator` (`next()` while `hasNext() == false`) or an invalid position in the Flex Queue. |
| `NullPointerException` | Dereferencing a `null` (e.g. a method call on an uninitialized variable). |
| `QueryException` | Problem on a SOQL query: assigning a query that returns 0 or >1 record to a singleton sObject variable, or a non-selective query. |
| `RequiredFeatureMissing` | Chatter feature required by code deployed to an org where Chatter is not enabled. |
| `SearchException` | Problem on a SOSL query (`search()`): `searchString` shorter than 2 characters. |
| `SecurityException` | Problem on the static methods of the `Crypto` class. |
| `SerializationException` | Data serialization problem. Used with Visualforce. |
| `SObjectException` | Problem on an sObject: updating a field that is only settable on `insert`, or accessing a field not queried in the SOQL. |
| `StringException` | Problem on a String: heap size overflow, invalid conversion, out-of-bounds substring index. |
| `TransientCursorException` | Transient problem on an Apex cursor. The failed transaction can be retried. |
| `TypeException` | Type conversion problem (e.g. `Integer.valueOf('a')`). |
| `UnexpectedException` | Non-recoverable internal Salesforce error. Halts execution. Contact support if needed. |
| `VisualforceException` | Problem on a Visualforce page. |
| `XmlException` | Problem on the XmlStream classes: XML read/write failure. |

---

## 2. Runtime exceptions — other namespaces

Each namespace exposes its own exceptions. The main ones:

| Namespace | Exception(s) | Explanation |
|---|---|---|
| `Cache` | `Cache.Org.OrgCacheException`, `Cache.Session.SessionCacheException` | Problem on the Platform Cache (invalid key, quota, non-serializable value). |
| `Canvas` | `Canvas.CanvasRenderException` | Rendering problem on a Canvas app. |
| `Compression` | `Compression.ZipException` | ZIP compression/decompression problem. |
| `ConnectApi` | `ConnectApi.ConnectApiException`, `NotFoundException`, `RateLimitException`, `InvalidParameterException` | Problems on Connect in Apex calls (Chatter, Communities): resource not found, call limit, invalid parameter. |
| `DataSource` | `DataSource.DataSourceException`, `DataSource.OAuthTokenExpiredException` | Problem on an Apex Connector Framework adapter (Salesforce Connect). |
| `Reports` | `Reports.UnsupportedReportTypeException`, `Reports.InvalidReportMetadataException` | Problem on the Reports and Dashboards API. |
| `Site` | `Site.ExceededPortalCapacityException` | Portal/site capacity exceeded. |

---

## 3. `System.StatusCode` codes — DML errors

Returned by `DmlException.getDmlType(index)` or in `Database.SaveResult.getErrors()`. These are the most frequent codes from Apex.

### 3.1 Validation and fields

| StatusCode | Explanation |
|---|---|
| `FIELD_CUSTOM_VALIDATION_EXCEPTION` | A validation rule (or an `addError()` in a trigger) blocked the record. Most frequent cause: a business constraint not met. |
| `REQUIRED_FIELD_MISSING` | A required field (mandatory at the field or page-layout level) is empty. |
| `FIELD_INTEGRITY_EXCEPTION` | Value inconsistent with the field's structure (e.g. invalid relationship, expected format not met). |
| `INVALID_FIELD_FOR_INSERT_UPDATE` | Field not settable in this context (e.g. specifying an `Id` on an `insert`). |
| `STRING_TOO_LONG` | Value exceeding the field's max length. |
| `INVALID_EMAIL_ADDRESS` | Invalid email format. |
| `INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST` | Value not part of a restricted picklist. |
| `BAD_CUSTOM_ENTITY_PARENT_DOMAIN` | Invalid parent domain for a custom entity. |
| `NUMBER_OUTSIDE_VALID_RANGE` | Numeric value outside the field's allowed range. |
| `INVALID_CROSS_REFERENCE_KEY` | Reference (lookup/master-detail) pointing to a non-existent record or one of the wrong type. |

### 3.2 Permissions and access

| StatusCode | Explanation |
|---|---|
| `INSUFFICIENT_ACCESS_OR_READONLY` | Insufficient permission (FLS/CRUD/sharing) or record read-only for the current user. |
| `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` | No permission on a referenced record (lookup/master-detail). Common with master-detail. |
| `FIELD_FILTER_VALIDATION_EXCEPTION` | Lookup filter not satisfied on a relationship field. |
| `CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY` | A trigger/process prevented the operation (often an exception in a cascading trigger). |
| `ENTITY_IS_DELETED` | Attempted operation on an already-deleted record. |
| `ENTITY_IS_LOCKED` | Locked record (approval process, or a concurrent row lock). |

### 3.3 Duplicates and uniqueness

| StatusCode | Explanation |
|---|---|
| `DUPLICATE_VALUE` | Uniqueness violation: duplicate value on a unique field or external id. |
| `DUPLICATES_DETECTED` | Active Duplicate Rule: a duplicate was detected (blocking). Retrieve the details via `getDuplicateResult()`. |
| `DUPLICATE_EXTERNAL_ID` | Duplicate external id during an upsert. |
| `DUPLICATE_USERNAME` | Username already taken (User object). |

### 3.4 Transaction and integrity

| StatusCode | Explanation |
|---|---|
| `UNABLE_TO_LOCK_ROW` | Unable to lock a row (concurrent contention, often in batch/parallelism on a shared parent). |
| `MIXED_DML_OPERATION` | DML on setup objects (User, Group…) and non-setup objects in the same transaction. Separate via `@future` or 2 transactions. |
| `SELF_REFERENCE_FROM_TRIGGER` | A record references itself via a trigger (loop). |
| `CIRCULAR_DEPENDENCY` | Circular dependency between records (e.g. a hierarchy). |
| `DELETE_FAILED` | Delete blocked: dependent child records or a referential constraint. |
| `DEPENDENCY_EXISTS` | Cannot delete because other components/records depend on it. |
| `TRIGGER_INTERNAL_ERROR` | Internal error while executing a trigger. |

### 3.5 Limits and system

| StatusCode | Explanation |
|---|---|
| `LIMIT_EXCEEDED` | A limit (often the number of related records, e.g. master-detail children) is exceeded. |
| `STORAGE_LIMIT_EXCEEDED` | The org's storage quota is reached. |
| `TOO_MANY_APEX_REQUESTS` | Too many concurrent Apex requests (concurrency limit). |
| `REQUEST_RUNNING_TOO_LONG` | Transaction running too long, killed by the platform. |
| `UNKNOWN_EXCEPTION` | Uncategorized platform-side error. |

---

## 4. Governor limit errors (`LimitException`)

All surface as `System.LimitException`, not catchable. Typical message in brackets.

| Limit | Message / threshold | Explanation |
|---|---|---|
| SOQL queries | `Too many SOQL queries: 101` | >100 SOQL queries per synchronous transaction (200 in async). #1 cause: SOQL inside a loop. |
| SOQL rows | `Too many query rows: 50001` | >50,000 rows returned cumulatively per transaction. |
| DML statements | `Too many DML statements: 151` | >150 DML statements per transaction. Cause: DML inside a loop (not bulkified). |
| DML rows | `Too many DML rows: 10001` | >10,000 rows processed by DML per transaction. |
| CPU time | `Apex CPU time limit exceeded` | >10,000 ms synchronous CPU (60,000 ms async). Heavy logic, nested loops. |
| Heap size | `Apex heap size too large` | >6 MB synchronous (12 MB async). Too much data in memory. |
| Callouts | `Too many callouts: 101` | >100 callouts per transaction. |
| Callout time | `Read timed out` / cumulative limit | Cumulative callout time >120 s per transaction. |
| Future calls | `Too many future calls: 51` | >50 `@future` calls per transaction. |
| Query locator rows | `Too many query locator rows` | Batch: a QueryLocator returning >50M rows. |
| Email invocations | `Too many Email Invocations: 11` | >10 `Messaging.sendEmail` per transaction. |
| Push notifications | push limit | Mobile/push notifications exceeded per transaction. |

---

## 5. Common compilation errors

They block the class save/deploy (no execution).

| Error | Explanation |
|---|---|
| `Variable does not exist: X` | Undeclared variable, out of scope, or a casing mistake. |
| `Method does not exist or incorrect signature: void X(...)` | Non-existent method, wrong number/type of arguments, or a missing namespace. |
| `Invalid type: X` | Non-existent or inaccessible type/class/sObject (often an undeployed custom object or a wrong API name). |
| `Field is not writeable: X.Y` | Assigning to a formula, rollup, or system field (read-only). |
| `Comparison arguments must be compatible types` | Comparison between incompatible types. |
| `Illegal assignment from X to Y` | Assignment between incompatible types without a cast. |
| `Expression cannot be assigned` | Invalid assignment target (e.g. a literal on the left of `=`). |
| `Loop must iterate over a collection type` | `for (:)` over a non-iterable type. |
| `DML requires SObject or SObject list type: X` | DML on a non-sObject type. |
| `Missing return statement required return type: X` | A code path without a `return` in a non-void method. |
| `Duplicate field selected` | A field listed twice in a SOQL SELECT. |
| `unexpected token: X` | Syntax error (missing parenthesis, semicolon, or brace). |
| `Method is not visible: X` | Calling a `private`/`protected` method out of scope. |
| `Class X must implement the method: Y` | An interface/abstract class whose required method is not implemented. |
| `Sharing not permitted in this context` | `with sharing`/`without sharing` misplaced or incompatible. |
| `Non-void method might not return a value` | Blocking warning on some paths without a return. |
| `Save error: Dependent class is invalid` | A dependent class has a compilation error, propagated. |

---

## 6. References

- [Exception Class and Built-In Exceptions](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_classes_exception_methods.htm) — official list of System exceptions
- [Enums (System.StatusCode)](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_enums.htm) — StatusCode enum
- [Error Handling — SOAP API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_concepts_errorhandling.htm) — API error codes
- [Status Codes and Error Responses — REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/errorcodes.htm) — REST codes
- [Execution Governors and Limits](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm) — up-to-date governor limits
