# Back-office Creniaut

Back-office commun aux projets de l'organisation. Premier module : le **tableau** (Kanban) des gros sujets, en ligne sur `https://todo.notias.fr`.

Conception : [`docs/superpowers/specs/2026-11-13-tableau-design.md`](docs/superpowers/specs/2026-11-13-tableau-design.md) · maquette : [`docs/maquette-tableau.html`](docs/maquette-tableau.html).

## Pile

Vite + React 19 + TypeScript strict, Chakra UI v3, TanStack Query, React Router, dnd-kit. Pas de serveur à nous : l'app parle directement à un projet Supabase dédié (Auth Google, Postgres avec RLS, Storage privé).

## Commandes

| Commande                                            | Rôle                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`                                       | App en local sur `http://localhost:5173`                                                         |
| `npm run build`                                     | Build de prod dans `dist/`                                                                       |
| `npm run lint` · `npm run check-types` · `npm test` | Vérifications (bloquantes en CI)                                                                 |
| `npm run check:db`                                  | Vérifie le schéma, les règles d'accès et l'historique sur la base (transaction annulée à la fin) |

## Variables

| Variable                        | Où                    | Rôle                                                                                            |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | `.env`, build Coolify | URL du projet Supabase                                                                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`, build Coolify | Clé publique (les données sont protégées par RLS)                                               |
| `DATABASE_URL`                  | `.env` uniquement     | Chaîne « session pooler » du projet, pour les migrations et `check:db`. Jamais préfixée `VITE_` |

## Base de données

- Migrations dans `supabase/migrations/`, appliquées par la CI à chaque push sur `main` (voir « Mise en ligne ») ; à la main si besoin : `npx supabase db push --db-url "$DATABASE_URL"`. Pas de `supabase login` : son jeton couvre tout le compte.
- Accès réservé aux e-mails de la table `members`. Ajouter un membre : `insert into members (email, name, initials) values (…);`.
- Ajouter un projet : `insert into projects (slug, name, color) values ('mon-projet', 'Mon projet', 'oklch(0.6 0.12 300)');`. Il apparaît dans le filtre et à l'adresse `/todo/mon-projet`.
- `tickets.priority` (`high`, `medium`, `low`) et `tickets.difficulty` (`easy`, `medium`, `hard`) sont facultatives. Le tri du tableau (« Manuel », « Priorité » ou « Difficulté »), mémorisé dans le navigateur, range les colonnes par priorité puis difficulté, ou par difficulté puis priorité ; « Fait » garde les plus récents en tête. Les menus « Priorité » et « Difficulté » de la barre d'outils filtrent les cartes (cases à cocher, « Sans priorité » et « Sans difficulté » compris), eux aussi mémorisés dans le navigateur ; aucune case cochée = pas de filtre.
- L'historique (`ticket_events`) et `tickets.last_actor` sont écrits par des triggers : e-mail du membre connecté, ou `claude` pour une requête sans session (connecteur MCP).

## Mise en ligne

Coolify, projet `backoffice` : ressource « Private Repository » sur ce repo, branche `main`, build par le `Dockerfile`, port 80, domaine `https://todo.notias.fr`. Les deux variables `VITE_` sont des **variables de build**. Le redéploiement automatique de Coolify est coupé : c'est la CI (`.github/workflows/ci.yml`) qui, à chaque push sur `main`, enchaîne vérifications, migration de la base (`supabase db push`), contrôle `scripts/check-db.mjs`, puis déploiement par l'API Coolify (`POST /api/v1/deploy?uuid=…`). Une migration ou un contrôle en échec bloque le déploiement : le site reste sur l'ancienne version. Secrets GitHub : `DATABASE_URL`, `COOLIFY_DEPLOY_URL`, `COOLIFY_TOKEN` (jeton Coolify à permission `deploy` seule, sans expiration). DNS : enregistrement `A` `todo` vers l'IP du VPS, chez IONOS.

## Connecteur Claude (MCP Supabase)

Chaque membre, sur sa machine, avec son propre compte Supabase invité dans l'organisation du back-office :

```bash
claude mcp add --scope user --transport http supabase-backoffice "https://mcp.supabase.com/mcp?project_ref=<ref>&features=database"
```

Puis, dans Claude Code : `/mcp` → `supabase-backoffice` → « Authenticate », et autoriser **uniquement l'organisation du back-office** dans le navigateur.

### Brancher un projet sur le tableau

Les autres projets (Notia, et les suivants) lisent et déplacent leurs tickets par ce connecteur ; ce repo-ci ne fait évoluer que le code et le schéma.

1. Ajouter le projet en base : `insert into projects (slug, name, color) values (…);` (voir « Base de données »).
2. Copier dans le `CLAUDE.md` du projet la section ci-dessous, en remplaçant `<slug>`.

````markdown
## Tableau du back-office (connecteur `supabase-backoffice`)

Slug de ce projet : `<slug>`. Tableau : https://todo.notias.fr/todo/<slug> (repo `Creniaut/backoffice`).

- Le tableau est le seul suivi de ce qui reste à faire : features, fixes, chantiers. Pas de fichier de todo à côté.
- Dès qu'on parle d'une feature ou d'un fix à faire plus tard, ou qu'on en repère un en travaillant, sans attendre qu'on le demande :
  chercher un ticket qui en parle déjà et le mettre à jour (description, colonne), sinon en créer un.
  « Idées » pour une piste pas encore décidée, « À faire » pour un travail décidé. Le signaler dans la réponse (titre et colonne).
- Au début d'un travail, chercher le ticket qui y correspond et le passer en « En cours ».
- Quand le travail est sur `main` : le ticket passe en « Fait » avec son `link` (la PR fusionnée, ou le commit sans PR).
  Une décision qui compte (choix, compromis, raison d'une contrainte) va dans la doc du projet, dans la partie concernée.
  Pas de journal de ce qui est fait : le tableau et les PR en tiennent lieu.
- Titre court qui dit ce qui change. Description : le besoin et la piste en 1 à 3 phrases, puis le détail utile au travail
  en liste `- [ ]` (fichiers, réglages, cas à vérifier), cochée `- [x]` au fil du travail.
  Une petite tâche se range de préférence dans le ticket du sujet qu'elle sert.
- Priorité et difficulté à chaque ticket créé, à revoir si le sujet change : `priority` (`high`, `medium`, `low`) dit l'urgence,
  `difficulty` (`easy`, `medium`, `hard`) l'effort.
- Ne jamais supprimer un ticket ni changer son responsable. Ne pas toucher à `members`, `projects` ni aux images sans demande.
- Ne jamais modifier le schéma depuis ce repo : les migrations vivent dans le repo du back-office.
- Tableau injoignable : suivre « Si le tableau ne répond pas » ci-dessous.

### Si le tableau ne répond pas

Outils `supabase-backoffice` absents, statut « Needs authentication » ou erreur d'accès : le dire tout de suite au membre,
sans contourner par une autre connexion à la base (`DATABASE_URL` du back-office compris).
Diagnostic : `claude mcp get supabase-backoffice` (ligne `Status`), puis donner la marche à suivre :

| Cas                                              | À faire par le membre                                                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connecteur introuvable                           | `claude mcp add --scope user --transport http supabase-backoffice "https://mcp.supabase.com/mcp?project_ref=touovviqnappcuclfnkl&features=database"`, puis l'autoriser (ligne suivante) |
| « Needs authentication » ou autorisation expirée | Dans Claude Code : `/mcp` → `supabase-backoffice` → « Authenticate » ; se connecter avec son compte Supabase et autoriser **uniquement l'organisation du back-office**                  |
| Accès refusé alors que l'autorisation est faite  | Son compte Supabase n'est pas invité dans l'organisation du back-office : demander l'invitation au propriétaire                                                                         |
| Outils toujours absents après ces étapes         | Relancer Claude Code (nouvelle session)                                                                                                                                                 |

En attendant, continuer le travail et lister en fin de réponse les tickets à créer ou à déplacer, pour les appliquer une fois reconnecté.

```sql
-- Tickets ouverts du projet
select id, title, status, priority, difficulty, assignee_email from tickets
where project_slug = '<slug>' and status <> 'done' order by status, priority nulls last, position;

-- Un ticket parle-t-il déjà du sujet ?
select id, title, status from tickets
where project_slug = '<slug>' and (title ilike '%<mot>%' or description ilike '%<mot>%');

-- Créer en haut de sa colonne ('idea' ou 'todo', le même aux deux endroits)
insert into tickets (project_slug, title, description, status, priority, difficulty, position)
values ('<slug>', '<titre>', '<description>', 'idea', '<high|medium|low>', '<easy|medium|hard>',
  (select coalesce(min(position), 0) - 1 from tickets where status = 'idea'));

-- Compléter un ticket existant
update tickets set description = '<description>' where id = <id>;

update tickets set status = 'doing',
  position = (select coalesce(min(position), 0) - 1 from tickets where status = 'doing')
where id = <id>;

update tickets set status = 'done', link = '<url de la PR, ou du commit sans PR>',
  position = (select coalesce(min(position), 0) - 1 from tickets where status = 'done')
where id = <id>;
```
````
