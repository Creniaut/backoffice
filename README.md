# Back-office Creniaut

Back-office commun aux projets de l'organisation. Premier module : le **tableau** (Kanban) des gros sujets, en ligne sur `https://todo.notias.fr`.

Conception : [`docs/superpowers/specs/2026-11-13-tableau-design.md`](docs/superpowers/specs/2026-11-13-tableau-design.md) · maquette : [`docs/maquette-tableau.html`](docs/maquette-tableau.html).

## Pile

Vite + React 19 + TypeScript strict, Chakra UI v3, TanStack Query, React Router, dnd-kit. Pas de serveur à nous : l'app parle directement à un projet Supabase dédié (Auth Google, Postgres avec RLS, Storage privé).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | App en local sur `http://localhost:5173` |
| `npm run build` | Build de prod dans `dist/` |
| `npm run lint` · `npm run check-types` · `npm test` | Vérifications (bloquantes en CI) |
| `npm run check:db` | Vérifie le schéma, les règles d'accès et l'historique sur la base (transaction annulée à la fin) |

## Variables

| Variable | Où | Rôle |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env`, build Coolify | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`, build Coolify | Clé publique (les données sont protégées par RLS) |
| `DATABASE_URL` | `.env` uniquement | Chaîne « session pooler » du projet, pour les migrations et `check:db`. Jamais préfixée `VITE_` |

## Base de données

- Migrations dans `supabase/migrations/`, appliquées avec `npx supabase db push --db-url "$DATABASE_URL"`. Pas de `supabase login` : son jeton couvre tout le compte.
- Accès réservé aux e-mails de la table `members`. Ajouter un membre : `insert into members (email, name, initials) values (…);`.
- Ajouter un projet : `insert into projects (slug, name, color) values ('mon-projet', 'Mon projet', 'oklch(0.6 0.12 300)');`. Il apparaît dans le filtre et à l'adresse `/todo/mon-projet`.
- L'historique (`ticket_events`) et `tickets.last_actor` sont écrits par des triggers : e-mail du membre connecté, ou `claude` pour une requête sans session (connecteur MCP).

## Mise en ligne

Coolify, projet `backoffice` : ressource « Private Repository » sur ce repo, branche `main`, build par le `Dockerfile`, port 80, domaine `https://todo.notias.fr`. Les deux variables `VITE_` sont des **variables de build**. Chaque push sur `main` redéploie. DNS : enregistrement `A` `todo` vers l'IP du VPS, chez IONOS.

## Connecteur Claude (MCP Supabase)

Chaque membre, sur sa machine, avec son propre compte Supabase invité dans l'organisation du back-office :

```bash
claude mcp add --scope user --transport http supabase-backoffice "https://mcp.supabase.com/mcp?project_ref=<ref>&features=database"
```

Puis autoriser **uniquement l'organisation du back-office** dans le navigateur. Les règles d'usage pour Claude sont dans le `CLAUDE.md` de chaque projet.
