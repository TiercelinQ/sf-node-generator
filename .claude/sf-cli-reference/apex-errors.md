# SF error reference — Apex, DML, limits, compilation (interpretation)

> Binding reference for **interpreting Salesforce errors surfaced by `sf`** — an `sf apex run` failure, a DML `StatusCode`, a `LimitException`, or a compile error returned by a deploy/save. Part of the `sf-cli-reference/` catalog: **loaded on demand, by section, never whole**.
> Use it to turn a raw Salesforce error name/code into a clear `Result` `message`; keep the raw code in `detail` for the log (`@rules/errors.md`). Route here from `@rules/sf-cli.md` whenever an `sf` result carries an Apex/DML/limit/compile error.
> This file is a **reference table**, not a command-syntax file — the `Globals:` convention of the command sections (INDEX §Reading convention) does not apply here. For the Apex *commands* (run anonymous Apex, run tests, logs) see `apex.md`.
> Source: Apex Reference Guide (Summer '26, API 67.0) + SOAP/REST API Developer Guide. Updated: 2026-07-01.

Ce document couvre 5 familles :
1. Exceptions runtime du namespace `System` (liste officielle complète)
2. Exceptions runtime des autres namespaces
3. Codes `System.StatusCode` retournés par les opérations DML (dont `FIELD_CUSTOM_VALIDATION_EXCEPTION`)
4. Erreurs de limites gouverneurs (`LimitException`)
5. Erreurs de compilation fréquentes

**Note sur les StatusCode.** L'enum `System.StatusCode` contient ~150 valeurs générées dans la WSDL propre à chaque org (`Enterprise WSDL`). La section 3 liste les codes DML réellement rencontrés côté Apex, pas les codes internes ou rares. La liste exhaustive est dans la WSDL de votre org (Setup > API).

**Rappel.** Les exceptions built-in ne peuvent qu'être `catch`, pas `throw`. Pour lever une erreur métier, étendre `Exception` (custom exception). `LimitException` et `System.assert` échoués ne sont pas catchables.

---

## 1. Exceptions runtime — namespace `System`

Liste officielle complète (Apex Reference Guide).

| Exception | Explication |
|---|---|
| `Exception` | Classe de base de toutes les exceptions. Sert de type générique dans un `catch (Exception e)`. |
| `AssertException` | Échec d'un `System.assert` / `Assert.*`. Halte l'exécution. Non catchable. Contient le message optionnel passé à `assert()`. |
| `AuraException` | Exception Aura héritée (legacy). Utiliser `AuraHandledException` à la place. |
| `AuraHandledException` | Renvoie un message d'erreur propre à un contrôleur JS (Lightning/LWC). Masque la stack trace côté client. |
| `AsyncException` | Problème sur une opération asynchrone : échec d'enqueue d'un appel async (`System.enqueueJob`, `@future`, batch). |
| `BigObjectException` | Problème sur des Big Objects : timeout de connexion à l'accès ou l'insertion. |
| `CalloutException` | Problème sur un callout web service (HTTP/SOAP) : échec de connexion, timeout, endpoint non autorisé (Remote Site Settings). |
| `DataWeaveScriptException` | Erreur runtime dans un script DataWeave exécuté en Apex. |
| `DmlException` | Problème sur une instruction DML (`insert`/`update`/`delete`/`upsert`) : champ requis manquant, validation, duplicate rule, etc. Voir section 3 pour le détail via `getDmlType()`. |
| `DuplicateMessageException` | Tentative d'enqueue d'un job Queueable avec une signature en doublon (deduplication). |
| `EmailException` | Problème d'envoi d'email : échec de livraison, limite atteinte, adresse invalide. |
| `ExternalObjectException` | Problème sur des external objects (Salesforce Connect) : timeout d'accès aux données du système externe. |
| `FatalCursorException` | Problème fatal sur un cursor Apex dans une transaction (non récupérable). |
| `FinalException` | Tentative de muter une collection/record read-only (sObject en trigger after update) ou une variable `final`. Halte l'exécution. |
| `FlowException` | Problème au démarrage d'une interview Flow depuis Apex : version active introuvable, flow non démarrable depuis Apex. |
| `HandledException` | Exception générique déjà gérée. |
| `IllegalArgumentException` | Argument illégal passé à une méthode (ex : `null` sur un paramètre non-nullable). |
| `InvalidHeaderException` | Header illégal fourni à un appel Apex REST (ex : header nommé `cookie`). |
| `InvalidParameterValueException` | Visualforce : paramètre invalide ou problème d'URL. Salesforce Functions : format `functionName` incorrect. |
| `LimitException` | Limite gouverneur dépassée (SOQL, DML, CPU, heap, callouts...). Non catchable. Voir section 4. |
| `JSONException` | Problème de sérialisation/désérialisation JSON (`System.JSON`, `JSONParser`, `JSONGenerator`) : JSON malformé, structure inattendue. |
| `ListException` | Problème sur une List : accès à un index hors bornes, opération invalide. |
| `MathException` | Problème sur une opération mathématique : division par zéro. |
| `NoAccessException` | Accès non autorisé : tentative d'accès à un sObject sans droit. Utilisé avec Visualforce. |
| `NoDataFoundException` | Visualforce : donnée inexistante (sObject supprimé). Functions : projet/fonction introuvable. |
| `NoSuchElementException` | Accès hors bornes via un `Iterator` (`next()` alors que `hasNext() == false`) ou position invalide dans la Flex Queue. |
| `NullPointerException` | Déréférencement d'un `null` (ex : appel de méthode sur une variable non initialisée). |
| `QueryException` | Problème sur une requête SOQL : assignation d'une requête retournant 0 ou >1 record à une variable sObject singleton, requête non sélective. |
| `RequiredFeatureMissing` | Feature Chatter requise sur un code déployé dans une org sans Chatter activé. |
| `SearchException` | Problème sur une requête SOSL (`search()`) : `searchString` de moins de 2 caractères. |
| `SecurityException` | Problème sur les méthodes statiques de la classe `Crypto`. |
| `SerializationException` | Problème de sérialisation de données. Utilisé avec Visualforce. |
| `SObjectException` | Problème sur un sObject : modification en `update` d'un champ modifiable uniquement en `insert`, accès à un champ non requêté en SOQL. |
| `StringException` | Problème sur une String : dépassement de heap size, conversion invalide, index de substring hors bornes. |
| `TransientCursorException` | Problème transitoire sur un cursor Apex. La transaction échouée peut être rejouée. |
| `TypeException` | Problème de conversion de type (ex : `Integer.valueOf('a')`). |
| `UnexpectedException` | Erreur interne non récupérable côté Salesforce. Halte l'exécution. Contacter le support si nécessaire. |
| `VisualforceException` | Problème sur une page Visualforce. |
| `XmlException` | Problème sur les classes XmlStream : échec de lecture/écriture XML. |

---

## 2. Exceptions runtime — autres namespaces

Chaque namespace expose ses propres exceptions. Les principales :

| Namespace | Exception(s) | Explication |
|---|---|---|
| `Cache` | `Cache.Org.OrgCacheException`, `Cache.Session.SessionCacheException` | Problème sur le Platform Cache (clé invalide, quota, valeur non sérialisable). |
| `Canvas` | `Canvas.CanvasRenderException` | Problème de rendu d'une app Canvas. |
| `Compression` | `Compression.ZipException` | Problème de compression/décompression ZIP. |
| `ConnectApi` | `ConnectApi.ConnectApiException`, `NotFoundException`, `RateLimitException`, `InvalidParameterException` | Problèmes sur les appels Connect in Apex (Chatter, Communities) : ressource introuvable, limite d'appels, paramètre invalide. |
| `DataSource` | `DataSource.DataSourceException`, `DataSource.OAuthTokenExpiredException` | Problème sur un adaptateur Apex Connector Framework (Salesforce Connect). |
| `Reports` | `Reports.UnsupportedReportTypeException`, `Reports.InvalidReportMetadataException` | Problème sur l'API Reports and Dashboards. |
| `Site` | `Site.ExceededPortalCapacityException` | Capacité du portail/site dépassée. |

---

## 3. Codes `System.StatusCode` — erreurs DML

Retournés par `DmlException.getDmlType(index)` ou dans `Database.SaveResult.getErrors()`. Ce sont les codes les plus fréquents en Apex.

### 3.1 Validation et champs

| StatusCode | Explication |
|---|---|
| `FIELD_CUSTOM_VALIDATION_EXCEPTION` | Une validation rule (ou un `addError()` en trigger) a bloqué le record. Cause la plus fréquente : contrainte métier non respectée. |
| `REQUIRED_FIELD_MISSING` | Un champ requis (obligatoire au niveau field ou page layout) est vide. |
| `FIELD_INTEGRITY_EXCEPTION` | Valeur incohérente avec la structure du champ (ex : relation invalide, format attendu non respecté). |
| `INVALID_FIELD_FOR_INSERT_UPDATE` | Champ non modifiable dans le contexte (ex : spécifier un `Id` dans un `insert`). |
| `STRING_TOO_LONG` | Valeur dépassant la longueur max du champ. |
| `INVALID_EMAIL_ADDRESS` | Format d'email invalide. |
| `INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST` | Valeur absente d'une picklist restreinte. |
| `BAD_CUSTOM_ENTITY_PARENT_DOMAIN` | Domaine parent invalide pour une entité custom. |
| `NUMBER_OUTSIDE_VALID_RANGE` | Valeur numérique hors de la plage autorisée du champ. |
| `INVALID_CROSS_REFERENCE_KEY` | Référence (lookup/master-detail) pointant vers un record inexistant ou d'un mauvais type. |

### 3.2 Droits et accès

| StatusCode | Explication |
|---|---|
| `INSUFFICIENT_ACCESS_OR_READONLY` | Droit insuffisant (FLS/CRUD/sharing) ou record read-only pour l'utilisateur courant. |
| `INSUFFICIENT_ACCESS_ON_CROSS_REFERENCE_ENTITY` | Pas de droit sur un record référencé (lookup/master-detail). Fréquent en master-detail. |
| `FIELD_FILTER_VALIDATION_EXCEPTION` | Lookup filter non respecté sur un champ relation. |
| `CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY` | Un trigger/process a empêché l'opération (souvent une exception dans un trigger en cascade). |
| `ENTITY_IS_DELETED` | Tentative d'opération sur un record déjà supprimé. |
| `ENTITY_IS_LOCKED` | Record verrouillé (approval process, ou verrou de ligne concurrent). |

### 3.3 Doublons et unicité

| StatusCode | Explication |
|---|---|
| `DUPLICATE_VALUE` | Violation d'unicité : valeur en doublon sur un champ unique ou external id. |
| `DUPLICATES_DETECTED` | Duplicate Rule active : un doublon a été détecté (bloquant). Récupérer les détails via `getDuplicateResult()`. |
| `DUPLICATE_EXTERNAL_ID` | External id en doublon lors d'un upsert. |
| `DUPLICATE_USERNAME` | Username déjà utilisé (objet User). |

### 3.4 Transaction et intégrité

| StatusCode | Explication |
|---|---|
| `UNABLE_TO_LOCK_ROW` | Impossible de verrouiller une ligne (contention concurrente, souvent en batch/parallélisme sur parent partagé). |
| `MIXED_DML_OPERATION` | DML sur objets setup (User, Group...) et non-setup dans la même transaction. Séparer via `@future` ou 2 transactions. |
| `SELF_REFERENCE_FROM_TRIGGER` | Un record se référence lui-même via un trigger (boucle). |
| `CIRCULAR_DEPENDENCY` | Dépendance circulaire entre records (ex : hiérarchie). |
| `DELETE_FAILED` | Suppression bloquée : records enfants dépendants ou contrainte référentielle. |
| `DEPENDENCY_EXISTS` | Suppression impossible car d'autres composants/records en dépendent. |
| `TRIGGER_INTERNAL_ERROR` | Erreur interne dans l'exécution d'un trigger. |

### 3.5 Limites et système

| StatusCode | Explication |
|---|---|
| `LIMIT_EXCEEDED` | Une limite (souvent nombre de records liés, ex : master-detail children) est dépassée. |
| `STORAGE_LIMIT_EXCEEDED` | Quota de stockage de l'org atteint. |
| `TOO_MANY_APEX_REQUESTS` | Trop de requêtes Apex concurrentes (limite de concurrence). |
| `REQUEST_RUNNING_TOO_LONG` | Transaction trop longue, tuée par la plateforme. |
| `UNKNOWN_EXCEPTION` | Erreur non catégorisée côté plateforme. |

---

## 4. Erreurs de limites gouverneurs (`LimitException`)

Toutes remontent comme `System.LimitException`, non catchable. Message typique entre crochets.

| Limite | Message / seuil | Explication |
|---|---|---|
| SOQL queries | `Too many SOQL queries: 101` | >100 requêtes SOQL par transaction synchrone (200 en async). Cause n°1 : SOQL dans une boucle. |
| SOQL rows | `Too many query rows: 50001` | >50 000 lignes retournées cumulées par transaction. |
| DML statements | `Too many DML statements: 151` | >150 instructions DML par transaction. Cause : DML dans une boucle (non bulkifié). |
| DML rows | `Too many DML rows: 10001` | >10 000 lignes traitées en DML par transaction. |
| CPU time | `Apex CPU time limit exceeded` | >10 000 ms CPU synchrone (60 000 ms async). Logique lourde, boucles imbriquées. |
| Heap size | `Apex heap size too large` | >6 MB synchrone (12 MB async). Trop de données en mémoire. |
| Callouts | `Too many callouts: 101` | >100 callouts par transaction. |
| Callout time | `Read timed out` / limite cumulée | Temps cumulé des callouts >120 s par transaction. |
| Future calls | `Too many future calls: 51` | >50 appels `@future` par transaction. |
| Query locator rows | `Too many query locator rows` | Batch : QueryLocator retournant >50 M lignes. |
| Email invocations | `Too many Email Invocations: 11` | >10 `Messaging.sendEmail` par transaction. |
| Push notifications | limite de push | Dépassement des notifications mobiles/push par transaction. |

---

## 5. Erreurs de compilation fréquentes

Bloquent le save/déploiement de la classe (pas d'exécution).

| Erreur | Explication |
|---|---|
| `Variable does not exist: X` | Variable non déclarée, hors scope, ou faute de casse. |
| `Method does not exist or incorrect signature: void X(...)` | Méthode inexistante, mauvais nombre/type d'arguments, ou namespace manquant. |
| `Invalid type: X` | Type/classe/sObject inexistant ou non accessible (souvent objet custom non déployé ou API name erroné). |
| `Field is not writeable: X.Y` | Assignation d'un champ formula, rollup, ou system (read-only). |
| `Comparison arguments must be compatible types` | Comparaison entre types incompatibles. |
| `Illegal assignment from X to Y` | Assignation entre types incompatibles sans cast. |
| `Expression cannot be assigned` | Cible d'assignation invalide (ex : littéral à gauche du `=`). |
| `Loop must iterate over a collection type` | `for (:)` sur un type non itérable. |
| `DML requires SObject or SObject list type: X` | DML sur un type non-sObject. |
| `Missing return statement required return type: X` | Chemin de code sans `return` dans une méthode non-void. |
| `Duplicate field selected` | Champ listé deux fois dans un SELECT SOQL. |
| `unexpected token: X` | Erreur de syntaxe (parenthèse, point-virgule, accolade manquants). |
| `Method is not visible: X` | Appel d'une méthode `private`/`protected` hors scope. |
| `Class X must implement the method: Y` | Interface/classe abstraite dont une méthode obligatoire n'est pas implémentée. |
| `Sharing not permitted in this context` | `with sharing`/`without sharing` mal placé ou incompatible. |
| `Non-void method might not return a value` | Warning bloquant sur certains chemins sans return. |
| `Save error: Dependent class is invalid` | Classe dépendante en erreur de compilation, propagée. |

---

## 6. Références

- [Exception Class and Built-In Exceptions](https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_classes_exception_methods.htm) — liste officielle des exceptions System
- [Enums (System.StatusCode)](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_enums.htm) — enum StatusCode
- [Error Handling — SOAP API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_concepts_errorhandling.htm) — codes d'erreur API
- [Status Codes and Error Responses — REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/errorcodes.htm) — codes REST
- [Execution Governors and Limits](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm) — limites gouverneurs à jour
