# Priorité et difficulté des tickets — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque ticket porte une priorité et une difficulté (3 niveaux, facultatives), visibles sur la carte, modifiables, et le tableau peut ranger ses colonnes par priorité.

**Architecture:** Deux enums Postgres nullables sur `tickets`, le trigger `tickets_log` les compte comme « modifié ». Côté front, deux types et leurs libellés dans `types.ts`, un sélecteur réutilisable `LevelPicker`, un tri pur `sortLane` et un mode de tri mémorisé dans le navigateur.

**Tech Stack:** React 19, Chakra UI v3, TanStack Query, dnd-kit, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-priorite-difficulte-design.md`

## Global Constraints

- Pas de commentaires dans le code ; identifiants en anglais ; textes de l'interface en français (CLAUDE.md).
- Toute requête Supabase passe par `src/board/api.ts`.
- Couleurs : tokens du thème (`src/theme.ts`), jamais en dur dans un composant.
- Valeurs : `priority` ∈ `high` « Haute », `medium` « Moyenne », `low` « Basse » ; `difficulty` ∈ `easy` « Facile », `medium` « Moyenne », `hard` « Difficile ». Les deux peuvent être `null`.
- `npm run lint`, `npm run check-types`, `npm test` passent.

## Review Focus

1. Ticket sans priorité ni difficulté (tous les tickets existants) : aucune pastille, rangé après les autres en mode priorité, rien ne casse. Test : tâches 2 et 3.
2. Glisser une carte à l'intérieur de sa colonne en mode priorité : aucune écriture. Test : `resolvePriorityDrop` (tâche 3).
3. Valeur absente ou invalide dans le stockage du navigateur, ou stockage refusé : mode manuel. Test : `readSortMode` (tâche 3).
4. Vue filtrée sur un projet, en mode priorité, carte glissée vers une autre colonne : elle arrive en haut de la colonne entière (`board.tickets`), pas seulement des cartes visibles. Test : tâche 3.
5. Changer la priorité inscrit « modifié » dans l'historique. Test : `scripts/check-db.mjs` (tâche 1, lancé après la migration).

---

### Task 1: Base et API

**Files:**
- Create: `supabase/migrations/20261117000000_ticket_priority_difficulty.sql`
- Modify: `src/board/types.ts`, `src/board/api.ts`, `src/test/fixtures.ts`, `scripts/check-db.mjs`
- Test: `src/board/api.test.ts`

**Interfaces:**
- Produces (`types.ts`) : `type Priority = "high" | "medium" | "low"`, `type Difficulty = "easy" | "medium" | "hard"`, `PRIORITIES: ReadonlyArray<{ id: Priority; label: string }>` (Haute, Moyenne, Basse, dans cet ordre), `DIFFICULTIES: ReadonlyArray<{ id: Difficulty; label: string }>` (Facile, Moyenne, Difficile) ; `Ticket.priority: Priority | null`, `Ticket.difficulty: Difficulty | null` ; `TicketPatch` accepte `priority` et `difficulty`.
- Produces (`api.ts`) : `createTicket(input)` accepte `priority?: Priority | null` et `difficulty?: Difficulty | null`.

- [ ] **Step 1: Tests (api.test.ts)**
  - `fetchBoard maps rows to camelCase with imageCount` : la ligne de test porte `priority: "high", difficulty: null` → le ticket a `priority: "high", difficulty: null`.
  - Nouveau `fetchBoard maps a row without the new columns to null` : ligne sans `priority` ni `difficulty` → les deux à `null`.
  - `updateTicket sends snake_case columns` : le patch `{ priority: "low", difficulty: "hard" }` part tel quel.
  - Nouveau `createTicket sends priority and difficulty` : l'insert contient `priority: "medium", difficulty: "easy"`.
- [ ] **Step 2: Lancer `npx vitest run src/board/api.test.ts`** — attendu : échec (champs absents).
- [ ] **Step 3: Implémenter**
  - Migration : `create type public.ticket_priority as enum ('high', 'medium', 'low')`, `create type public.ticket_difficulty as enum ('easy', 'medium', 'hard')`, `alter table public.tickets add column priority public.ticket_priority, add column difficulty public.ticket_difficulty` ; `create or replace function public.tickets_log()` reprise de la première migration, la condition « edited » gagnant `or new.priority is distinct from old.priority or new.difficulty is distinct from old.difficulty`.
  - `types.ts`, `api.ts` (`TicketRow`, `toTicket` avec `?? null`, `toRow`, `createTicket`), `makeTicket` (défauts `null`).
  - `check-db.mjs` : après le test de `title`, `update tickets set priority = 'high' where id = $1` → un évènement `edited` de plus.
- [ ] **Step 4: `npx vitest run src/board/api.test.ts`** — attendu : vert.
- [ ] **Step 5: Commit** `feat(board): priorité et difficulté en base et dans l'API`

### Task 2: Carte, volet et nouveau ticket

**Files:**
- Create: `src/board/LevelPicker.tsx`
- Modify: `src/theme.ts`, `src/board/TicketCard.tsx`, `src/board/TicketDrawer.tsx`, `src/board/NewTicketDialog.tsx`
- Test: `src/board/TicketCard.test.tsx`, `src/board/TicketDrawer.test.tsx`, `src/board/NewTicketDialog.test.tsx`

**Interfaces:**
- Consumes : `Priority`, `Difficulty`, `PRIORITIES`, `DIFFICULTIES` (tâche 1).
- Produces : `LevelPicker<T extends string>({ label, options, value, onChange }: { label: string; options: ReadonlyArray<{ id: T; label: string }>; value: T | null; onChange: (value: T) => void })`, un `SegmentGroup` à `aria-label={label}` comme `StatusPicker`. Cliquer la valeur déjà choisie n'appelle rien.
- Tokens `priority.high`, `priority.medium`, `priority.low` dans `theme.ts`, à côté de `status.*` (rouge, ambre, gris).

- [ ] **Step 1: Tests**
  - Carte `shows « Priorité haute » and « Facile » when set` : ticket `priority: "high", difficulty: "easy"` → texte « Haute » avec `aria-label` « Priorité haute », texte « Facile ».
  - Carte `shows no priority nor difficulty when unset`.
  - Volet `changing « Priorité » to « Haute » sends priority high` (même forme que le test de « Colonne ») ; `changing « Difficulté » to « Difficile » sends difficulty hard`.
  - Nouveau ticket `creating sends the chosen priority and difficulty` ; sans choix, l'insert envoie `priority: null, difficulty: null`.
- [ ] **Step 2: `npx vitest run src/board`** — attendu : ces tests échouent.
- [ ] **Step 3: Implémenter** : pastille de priorité (point coloré + libellé) et difficulté en texte `app.muted` dans la ligne du bas de `CardContent`, avant l'avatar ; sections « Priorité » et « Difficulté » sous « Colonne » dans le volet ; les deux `LevelPicker` dans le formulaire de création.
- [ ] **Step 4: `npx vitest run src/board`** — attendu : vert.
- [ ] **Step 5: Commit** `feat(board): priorité et difficulté sur la carte, dans le volet et à la création`

### Task 3: Tri par priorité

**Files:**
- Create: `src/board/sort.ts`, `src/board/SortToggle.tsx`
- Modify: `src/board/position.ts`, `src/board/BoardColumns.tsx`, `src/board/BoardPage.tsx`
- Test: `src/board/sort.test.ts`, `src/board/position.test.ts`, `src/board/BoardPage.test.tsx`

**Interfaces:**
- Produces (`sort.ts`) : `type SortMode = "manual" | "priority"` ; `sortLane(tickets: Ticket[], mode: SortMode): Ticket[]` (nouveau tableau) ; `readSortMode(): SortMode` et `writeSortMode(mode: SortMode): void` sur la clé `board-sort` de `localStorage`, `"manual"` si absent, invalide ou stockage refusé.
- Produces (`position.ts`) : `resolvePriorityDrop(tickets: Ticket[], id: number, status: Status): TicketPatch | null` : `null` si la carte est déjà dans `status`, sinon `{ status, position: topPosition(tickets, status) }`.
- `SortToggle({ value, onChange })` : `SegmentGroup` `aria-label="Trier"`, choix « Manuel » et « Priorité ».

- [ ] **Step 1: Tests**
  - `sortLane` priorité : `[low, null, high+hard, high+easy, medium]` → `high+easy, high+hard, medium, low, null` ; à priorité et difficulté égales, ordre de `position`.
  - `sortLane` manuel : ordre de `position`.
  - `readSortMode` : `"priority"` stocké → `"priority"` ; `"n'importe quoi"` → `"manual"` ; `getItem` qui lève → `"manual"`.
  - `resolvePriorityDrop` : même colonne → `null` ; autre colonne → en haut de la colonne entière, cartes d'autres projets comprises.
  - Page `« Trier : Priorité » ranks cards by priority and is remembered` : clic sur « Priorité » → ordre des cartes d'une colonne selon la priorité, `localStorage["board-sort"] === "priority"`, et une nouvelle page s'ouvre déjà triée.
- [ ] **Step 2: `npx vitest run src/board`** — attendu : ces tests échouent.
- [ ] **Step 3: Implémenter** : `BoardPage` lit `readSortMode()` à l'ouverture, affiche `SortToggle` à côté du résumé, passe `sortMode` à `BoardColumns` ; les colonnes passent par `sortLane` ; en mode priorité, `onDragEnd` utilise `resolvePriorityDrop(board.tickets, …)` au lieu de `resolveDrop`.
- [ ] **Step 4: `npx vitest run`** — attendu : toute la suite verte.
- [ ] **Step 5: Commit** `feat(board): tri des colonnes par priorité`

### Task 4: Conventions

**Files:**
- Modify: `README.md` (« Base de données », modèle « Brancher un projet » et ses requêtes), `CLAUDE.md` (requêtes)

- [ ] **Step 1:** Ajouter dans le modèle de section : « À la création, renseigner `priority` (`high`, `medium`, `low`) et `difficulty` (`easy`, `medium`, `hard`) » ; requête `insert` avec les deux colonnes ; requête « tickets ouverts » triée par priorité.
- [ ] **Step 2:** `npm run lint && npm run check-types && npm test` — attendu : vert.
- [ ] **Step 3: Commit** `docs: priorité et difficulté dans les conventions du tableau`

Mise en ligne (hors plan, avec accord), dans cet ordre : `npx supabase db push --db-url "$DATABASE_URL"` puis `npm run check:db` **avant** la fusion (le front fusionné envoie `priority` à la création : sans la colonne, créer un ticket échouerait), puis fusion, puis mise à jour du `CLAUDE.md` de notia et remplissage de ses tickets ouverts.
