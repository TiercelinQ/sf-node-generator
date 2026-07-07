# Guide d'utilisation - Salesforce Node CLI Generator (`sf-node`)

> Générateur Claude Code d'outils **CLI Node.js / TypeScript headless**, couplés obligatoirement à **Salesforce** (`sf` v2). Version unifiée : pipeline de génération + skills de maintenance, rôle explicite par skill, specs persistées, vérification exécutable, mémoire native.

---

## Structure du framework

```
sf-node/
├── CLAUDE.md                 # Instructions core (EN) : persona, communication, pipeline, stack, règles, index commandes, calibrage
├── GUIDE.md                  # Ce fichier
├── README.md                 # Présentation du repo (EN)
├── LICENSE.txt
├── .gitignore / .gitattributes
└── .claude/
    ├── sf-cli-reference/     # Catalogue commandes/flags sf v2 (chargé par section, jamais en entier)
    ├── rules/
    │   ├── architecture.md   # Couches commands / services / sf / output, racine cli.ts, livraison par lots
    │   ├── cli.md            # Programme commander, codes de sortie 0/1/2, stdout=données / stderr=logs
    │   ├── errors.md         # Contrat Result<T>, erreurs nommées, escalade service to commande to frontière
    │   ├── config.md         # config.ts (cascade), package.json, tsup, tsconfig, versions de dépendances
    │   ├── security.md       # cross-spawn args array, validation, chemins confinés, secrets keychain
    │   ├── sf-cli.md         # Intégration Salesforce OBLIGATOIRE : runner + helpers typés + starter org/data
    │   ├── sfdx-project.md   # Mode sfdx-project : détection sfdx-project.json, .forceignore, deploy/retrieve
    │   ├── output.md         # Formatters json / csv / xlsx / table, destination stdout / fichier
    │   ├── logging.md        # pino obligatoire (fichier + stderr), zéro console.log
    │   ├── tests.md          # vitest opt-in, couverture par couche, mock cross-spawn
    │   ├── verification.md   # Vérification EXÉCUTABLE centralisée + intégrité statique
    │   └── readme.md         # Synchro README post-livraison (régénération auto)
    ├── skills/
    │   ├── sf-node-app/            # Menu démarrage / reprise / maintenance (4 options)
    │   ├── sf-node-p1-scoping/     # Scoping to docs/specs/01-scoping.md
    │   ├── sf-node-p2-featuring/   # Fiche commandes to docs/specs/02-featuring.md
    │   ├── sf-node-p3-interface/   # Contrat de commandes CLI to docs/specs/03-interface.md
    │   ├── sf-node-p4-architect/   # Contrat architectural verrouillé to docs/specs/04-architect.md
    │   ├── sf-node-p5-development/ # Livraison par lots (enchaînement auto)
    │   ├── sf-node-add-feature/    # Ajouter une commande à un outil livré
    │   ├── sf-node-trace-feature/  # Tracer une commande à travers les couches
    │   ├── sf-node-fix-issue/      # Corriger un bug : arbre de décision, cause racine
    │   ├── sf-node-refactor-code/  # Restructurer sous validation explicite uniquement
    │   ├── sf-node-run-tests/      # Vérification exécutable (typecheck, lint, build, smoke)
    │   ├── sf-node-load-project/   # Chargement d'un outil existant
    │   ├── sf-node-generate-readme/ # Génération README.md d'un outil existant
    │   ├── sf-node-save-session/   # Sauvegarde de session
    │   ├── sf-node-show-state/     # État courant du projet
    │   ├── sf-node-show-contract/  # Arborescence du contrat validé
    │   └── sf-node-save-memory/    # Persiste dans la mémoire native Claude Code
    ├── settings.json         # Permissions d'exécution (npm, npx, node, tsx, sf) + garde-fous deny (.env, secrets)
    └── settings.local.json   # Overrides locaux (non versionné)
```

> Pas de `design-system.md` ni de `layout.md` : la cible est headless (aucune interface à rendre). Le contrat visuel est remplacé par un contrat CLI (stdout / stderr / codes de sortie).

---

## Spécificités de ce framework

| Point | Détail |
| ----- | ------ |
| **Salesforce obligatoire** | Aucune question "sf oui/non". Phase 1 demande le mode de couplage (`standalone` ou `sfdx-project`). `sf` v2 uniquement, jamais `sfdx` legacy. |
| **Headless** | Pas de palette, pas d'UI, pas d'i18n. Retour via `Result<T>` + stdout(données) / stderr(logs) + codes de sortie 0/1/2. |
| **Deux modes de couplage** | `standalone` (org via `sf`, sans projet) ou `sfdx-project` (dans un dossier `sfdx-project.json` : deploy/retrieve/source), choisis en Phase 1. |
| **Sorties riches** | Couche formatters JSON / CSV / xlsx / table, destination stdout ou fichier. |
| **Sécurité process** | Tout appel `sf` via `cross-spawn` (tableau d'arguments, pas de shell) depuis `src/sf/runner.ts` uniquement. Secrets dans le keychain `sf`, jamais dans un fichier. |

---

## Installation

```bash
# Démarrer Claude Code depuis le dossier du framework (ou le copier dans le projet cible).
claude
```

### Prérequis

```bash
claude --version      # Claude Code CLI installé et connecté
node --version        # Node.js 24 LTS+ (pour exécuter les outils générés)
sf --version          # Salesforce CLI v2 (prérequis runtime des outils générés)
```

### Activer la mémoire (une seule fois, par machine)

```
/config to Memory to Enable auto memory to On
```

---

## Démarrer un nouvel outil

```
/sf-node-app to 1
```

### Phase 1 - Scoping

Objectif (texte libre), puis racine du projet (nom kebab-case propose, emplacement, création), puis paramètres fermés en deux blocs `AskUserQuestion` :

- **Bloc 1** : mode de couplage (`standalone` / `sfdx-project` ; si `sfdx-project`, chemin du dossier demandé) · formats de sortie (JSON / CSV / xlsx / table) · tests (`vitest`) · interactivité (non-interactif / prompts).
- **Bloc 2** : forme d'exécution (CLI à sous-commandes / + scripts autonomes / lib + bins) · distribution (local / paquet npm / exe bundle) · stratégie de config (cascade / `.env` + flags / flags + `config.ts`).

Défauts framework non demandés (surchargés sur demande) : parseur `commander`, logger `pino`, TypeScript strict + ESM, build `tsup`. Détection Salesforce/SFDX sur l'objectif : `deploy`/`retrieve`/`source`/`sfdx-project` recommande `sfdx-project`, sinon `standalone`.

Calibrage **provisoire** annoncé (figé après Phase 2) :

| Taille        | Lots (sans tests) | Lots (avec tests) |
| ------------- | ----------------- | ----------------- |
| Petit         | 3                 | 4                 |
| Moyen / Grand | 4                 | 5                 |

Écrit `docs/specs/01-scoping.md`.

### Phase 2 - Featuring

Nom de l'outil (proposé, confirmé par l'utilisateur, kebab-case pour le `bin`). Élicitation des **commandes**, MoSCoW, périmètre v1.0, calibrage **confirmé et verrouillé** sur le compte de commandes. Validation bloquante. Écrit `docs/specs/02-featuring.md`.

### Phase 3 - Command Interface

Pour chaque commande : nom complet (`groupe verbe`), args positionnels, flags/options (type, défaut, requis), source d'entrée, format + destination de sortie, conditions de sortie (0/1/2), prompt interactif (si activé). Flags globaux (`--target-org`, `--format`, `--output`, `--log-level`, ...). Validation bloquante. Écrit `docs/specs/03-interface.md`.

### Phase 4 - Architect

Arborescence + rôle de chaque fichier + **registre des commandes** (commande to service to helper `sf` to formatter) + `Result<T>` + erreurs nommées + table des clés de config + mode de couplage. **Verrouillé après validation.** Écrit `docs/specs/04-architect.md` (source de vérité).

### Phase 5 - Development

Fichiers écrits directement sur le disque. Annonce `Lot N/[total] - [contenu]`. Enchaînement automatique. Le runner `sf` part au lot 1. Dernier lot : `package.json` + configs, `README.md`, `CLAUDE.md` de l'outil (identité), `.claude/settings.json` (deny + hook `Stop`). Vérification exécutable appliquée.

---

## Reprendre une session

```
/sf-node-save-session            # sauvegarder en fin de session (docs/sessions/)
/sf-node-app to 2                # reprendre : fournir le chemin du fichier SESSION
```

---

## Travailler sur un outil livré

```
/sf-node-app to 3     # ou directement /sf-node-load-project depuis la racine du projet
```

Claude lit `docs/specs/04-architect.md` (priorité), sinon le README, sinon le code, puis applique toutes les règles. Outil sans README : `/sf-node-generate-readme`.

### Maintenance (`/sf-node-app to 4`)

| Besoin                          | Commande                 |
| ------------------------------- | ------------------------ |
| Ajouter une commande            | `/sf-node-add-feature`   |
| Comprendre / tracer le code     | `/sf-node-trace-feature` |
| Corriger un bug                 | `/sf-node-fix-issue`     |
| Restructurer (sous validation)  | `/sf-node-refactor-code` |
| Vérifier le build / les checks  | `/sf-node-run-tests`     |

---

## Vérification exécutable

`rules/verification.md` est la source unique. Commandes (échec bloquant quand l'environnement le permet) :

```bash
npm install                  # résolution des dépendances
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint (flat config)
npm run build                # tsup to dist/cli.js (shebang, exécutable)
npm test                     # vitest run (si tests activés)
node dist/cli.js --help      # smoke : usage, exit 0
node dist/cli.js --version   # smoke : version, exit 0
```

> Le smoke complet des opérations `sf` réelles (query, deploy) nécessite une org authentifiée via `sf` : hors périmètre de la vérification automatique.

`/sf-node-run-tests` exécute cette échelle ; `/sf-node-fix-issue` y renvoie pour confirmer une correction.

---

## Sécurité

`rules/security.md` est non négociable et appliqué à 100% : tout `sf` via `cross-spawn` (tableau d'arguments, pas de `shell: true`) depuis `src/sf/runner.ts` uniquement ; données externes validées depuis `unknown` ; chemins issus de l'entrée résolus et confinés sous le dossier de base (pas de traversée) ; **aucun secret** dans `.env` / config / logs / commits (keychain `sf`, alias non-secret au plus). `/sf-node-fix-issue` et `/sf-node-add-feature` y renvoient.

---

## Gestion des anomalies et mémoire

Après correction (`/sf-node-fix-issue` ou Phase 5), Claude produit un bilan de nettoyage puis propose `Veux-tu mémoriser ce point ? /sf-node-save-memory`. `/sf-node-save-memory` catégorise et écrit dans la **mémoire native Claude Code** (+ `MEMORY.md`).

---

## Commandes de référence

| Commande                   | Modèle | Action                                          |
| -------------------------- | ------ | ----------------------------------------------- |
| `/sf-node-app`             | Haiku  | Menu démarrage / reprise / maintenance          |
| `/sf-node-p1-scoping`      | Sonnet | Scoping (couplage, sorties, tests, exécution)   |
| `/sf-node-p2-featuring`    | Sonnet | Fiche commandes + calibrage verrouillé          |
| `/sf-node-p3-interface`    | Sonnet | Contrat de commandes CLI                        |
| `/sf-node-p4-architect`    | Sonnet | Contrat architectural verrouillé                |
| `/sf-node-p5-development`  | Sonnet | Livraison par lots - enchaînement automatique   |
| `/sf-node-add-feature`     | Sonnet | Ajouter une commande à un outil livré           |
| `/sf-node-trace-feature`   | Sonnet | Tracer une commande à travers les couches       |
| `/sf-node-fix-issue`       | Sonnet | Corriger un bug - cause racine                  |
| `/sf-node-refactor-code`   | Sonnet | Restructurer sous validation                    |
| `/sf-node-run-tests`       | Sonnet | Vérification exécutable                          |
| `/sf-node-load-project`    | Sonnet | Charger un outil existant                        |
| `/sf-node-generate-readme` | Sonnet | Générer README.md d'un outil existant           |
| `/sf-node-save-session`    | Haiku  | Sauvegarder la session                          |
| `/sf-node-show-state`      | Haiku  | État courant                                    |
| `/sf-node-show-contract`   | Haiku  | Contrat architectural validé                    |
| `/sf-node-save-memory`     | Haiku  | Persister dans la mémoire native                |

---

## Structure d'un outil généré

```
mon-outil/
├── package.json · tsconfig.json · tsup.config.ts · eslint.config.mjs · .prettierrc
├── .env.example · .gitignore · README.md
├── CLAUDE.md                      # Identité de l'outil (origine, contexte, écarts) - généré en fin de Phase 5
├── .claude/settings.json          # Garde-fous + hook Stop (outil auto-contrôlé)
├── docs/specs/                    # Specs de génération (langue utilisateur)
└── src/
    ├── cli.ts                     # bin : programme commander, mapping Result to code de sortie
    ├── config.ts · logger.ts · types.ts · errors.ts   # partagé - importable par toutes les couches
    ├── sf/                        # runner.ts (cross-spawn) · helpers.ts · project.ts (mode sfdx)
    ├── services/                  # logique métier - retourne Result<T>
    ├── commands/                  # adaptateurs fins (starter : org.ts, data.ts)
    └── output/                    # index.ts (dispatch) · csv.ts · xlsx.ts · table.ts
```

---

## Points de vigilance

- Salesforce est **obligatoire** : `sf` v2 uniquement, jamais `sfdx` legacy. Tout appel passe par `src/sf/runner.ts` (cross-spawn, tableau d'arguments).
- `stdout` = données uniquement (pipeable), `stderr` = logs + messages. `pino` n'écrit jamais sur stdout.
- Codes de sortie mappés une seule fois à la frontière `cli.ts` (0/1/2), jamais en dur ailleurs.
- Le contrat (`docs/specs/04-architect.md`) est verrouillé. Tout changement structurel passe par `/sf-node-add-feature` ou le protocole de déclaration d'écart.
- Aucun secret dans un fichier : `sf` détient les tokens dans le keychain de l'OS ; l'outil ne stocke qu'un alias non-secret.
- `/sf-node-load-project`, `/sf-node-generate-readme` et les skills de maintenance s'invoquent depuis la racine du projet cible.
