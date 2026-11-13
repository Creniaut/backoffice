# Back-office Creniaut — module Tableau (Kanban)

Date : 2026-11-13. Statut : validée (« go direct en prod »).
Maquette de référence : https://claude.ai/artifact/BupbLjSrEqXmjgQDvPNnBt (privée, compte du propriétaire).

## Intention

Les deux membres de l'organisation GitHub `Creniaut` (CreniautB et EmilienCR) n'ont pas de vue d'ensemble de ce qu'ils ont à faire.
`tasks/todo.md` dans notia est le carnet de travail de Claude : 166 lignes de détails (vérifs, réglages), trop dense et pas visuel, ils ne le lisent pas.

Ils veulent un **tableau Kanban à eux** pour les gros sujets à long terme, ceux auxquels ils doivent penser, lisible d'un coup d'œil,
commun à tous leurs projets (Notia aujourd'hui, d'autres plus tard). Claude doit pouvoir lire et déplacer les tickets pendant les sessions de code.

Le tableau est le premier module d'un **petit back-office global à l'organisation** : d'autres modules viendront plus tard, aucun n'est défini.

## Objectifs

- Tableau Kanban à 4 colonnes, glisser-déposer, filtre par projet, détail d'un ticket avec historique.
- Images sur les tickets.
- Accès réservé aux deux membres, connexion Google.
- Claude lit, crée et déplace les tickets depuis n'importe quel repo, sur la machine de l'un ou l'autre.
- En ligne sur `https://todo.notias.fr`.

## Non-objectifs (v1)

- Autres modules du back-office (seulement une barre de navigation prête à en recevoir).
- Gestion des projets dans l'interface : ils s'ajoutent en SQL (par Claude), il y en aura 2 au départ.
- Colonnes différentes selon le projet, modèles de tableaux. Une seule liste de colonnes pour tous.
- Temps réel, notifications, commentaires, échéances, priorités, étiquettes.
- Lien automatique avec GitHub (issues, PR) : le lien de PR se saisit à la main ou par Claude.
- Claude n'ajoute ni ne lit les images.

## Anti-objectifs (échec même si ça marche)

- Un deuxième `todo.md` : si le tableau se remplit de petites tâches, il devient illisible. Il ne porte que les gros sujets.
- Des données lisibles par quelqu'un d'autre que les deux membres.
- Un accès de Claude à la base de prod de notia à cause de ce projet.

## Contraintes

- Repo séparé de notia : `Creniaut/backoffice` (privé). Rien de ce projet dans le repo notia, sauf la section du `CLAUDE.md` (plus bas).
- Projet Supabase **dédié**, dans une **organisation Supabase dédiée au back-office**, en **offre Pro** (pas de pause après 7 jours d'inactivité ; ~25 $/mois). Pas dans l'organisation de notia : l'autorisation du connecteur MCP vaut pour une organisation entière, elle atteindrait la prod de notia. Chaque membre a son propre compte Supabase invité dans cette organisation. La création de l'organisation et du projet est faite par le propriétaire (facturation).
- Hébergement sur le VPS existant, via Coolify, selon les conventions du dépôt `Creniaut/infra` (`docs/coolify.md`) : un projet Coolify par application ; pour un site simple, ressource « Private Repository » + Dockerfile, construite par Coolify. Fiche à ajouter dans `infra/docs/projects/backoffice.md` (copie de `_template.md`).
- DNS chez IONOS (sous-domaine `todo` de `notias.fr`).
- Les deux membres et Claude connaissent la pile de notia : React, Chakra UI v3, TanStack Query, TypeScript strict.
- Interface en français.

## Approches considérées

| Approche | Compromis | Décision |
|---|---|---|
| A. GitHub Projects (tableau de l'organisation, piloté par Claude via `gh project`) | Aucun code ni hébergement ; mais interface GitHub, pas leur domaine, données chez GitHub | Écartée par les membres : ils veulent leur propre outil, base d'un back-office plus large |
| **B. App à part, Supabase dédié, `todo.notias.fr`** | Leur design et leur domaine, extensible ; une app de plus à construire (1 à 2 sessions) et à entretenir, ~25 $/mois d'organisation Supabase Pro | **Choisie** |
| C. App dans le monorepo notia, tables dans la base de notia | Moins d'infra ; mais lié à Notia, et l'accès de Claude toucherait la base de prod de notia | Écartée |

## Ce qui est décidé

### Fonctionnel (validé sur la maquette)

- **Colonnes**, dans cet ordre : Idées, À faire, En cours, Fait. Fixes, communes à tous les projets.
- **Ticket** : titre, description (texte simple, liens cliquables), projet, colonne, responsable (un des deux membres ou personne), lien facultatif (PR, doc), images.
- **Carte** : pastille et nom du projet, titre, avatar du responsable, lien court (ex. « PR #148 »), indicateur d'images, et « Claude · hier » quand la dernière modification vient de Claude.
- **Filtre par projet** dans l'adresse : `/todo` = tous les projets, `/todo/<slug>` = un projet (`/todo/notia`). Boutons « Tous les projets / Notia / Back-office » avec le nombre de tickets. `/` redirige vers `/todo`.
- **Détail** : volet à droite (plein écran sur téléphone) ouvert au clic sur une carte. Titre et description modifiables, colonne et responsable en listes déroulantes, images, historique (« Claude — Déplacé vers En cours — hier »).
- **Création** : bouton « Nouveau ticket » et « + » en tête de colonne (colonne pré-remplie ; projet pré-rempli si un filtre est actif).
- **Suppression** d'un ticket par un membre, avec confirmation.
- **Images** : ajout par collage (Ctrl+V) dans le volet, glisser-déposer d'un fichier sur le volet, ou bouton « Ajouter une image ». PNG, JPEG, WebP, GIF, 5 Mo max chacune. Vignettes dans le volet, agrandissement au clic, suppression possible.

### Technique

| Sujet | Décision |
|---|---|
| App | Vite + React + TypeScript (strict), SPA sans serveur à nous |
| UI | Chakra UI v3, thème clair et sombre suivant le système |
| Données | `@supabase/supabase-js` + TanStack Query ; mise à jour optimiste au déplacement ; rafraîchissement au retour sur l'onglet (pas de temps réel) |
| Glisser-déposer | `@dnd-kit` (entre colonnes et dans une colonne), capteurs souris et tactile |
| Routes | React Router : `/todo`, `/todo/:project`, ticket ouvert en paramètre `?ticket=<id>` pour pouvoir partager un lien |
| Connexion | Supabase Auth, Google uniquement (inscription par e-mail désactivée) |
| Autorisation | RLS sur toutes les tables et sur le bucket d'images : accès réservé aux e-mails de la table `members`. Un compte Google hors liste voit un écran « Accès réservé » et peut se déconnecter |
| Schéma | Migrations SQL versionnées dans `supabase/migrations/`, appliquées avec `supabase db push --db-url` (chaîne de connexion du seul projet back-office, dans un `.env` ignoré par git). Pas de `supabase login` : son jeton couvre tout le compte, notia compris |
| Environnements | Un seul projet Supabase, celui de prod : on construit dessus tant que le tableau est vide, puis chaque migration est relue avant d'être appliquée (sauvegarde quotidienne de l'offre Pro). Pas de Supabase local (Docker absent). `http://localhost:5173` ajouté aux URL de redirection de l'Auth pour le dev |
| Images | Bucket Storage **privé** `ticket-images`, chemin `<ticket_id>/<uuid>.<ext>`, affichage par URL signées |
| Mise en ligne | Dockerfile (build Vite → nginx avec repli SPA vers `index.html`), ressource Coolify construite depuis le repo à chaque push sur `main`, domaine `https://todo.notias.fr`. Variables `VITE_SUPABASE_URL` et clé publique Supabase passées au build |
| CI | GitHub Actions sur PR : lint, check-types, tests (Vitest) |

### Modèle de données

| Table | Colonnes |
|---|---|
| `members` | `email` (clé), `name`, `initials` |
| `projects` | `slug` (clé, ex. `notia`), `name`, `color` |
| `tickets` | `id`, `project_slug` → projects, `title`, `description`, `status` (`idea`, `todo`, `doing`, `done`), `assignee_email` → members (nullable), `link` (nullable), `position` (ordre dans la colonne), `created_at`, `updated_at` |
| `ticket_events` | `id`, `ticket_id` → tickets (cascade), `actor` (e-mail d'un membre ou `claude`), `kind` (`created`, `moved`, `assigned`, `edited`), `detail`, `at` |
| `ticket_images` | `id`, `ticket_id` → tickets (cascade), `path` (objet Storage), `created_at`, `created_by` |

L'historique est écrit par un **trigger** sur `tickets` (insertion et mise à jour), pas par le client.
Acteur : l'e-mail du membre si la requête porte un JWT d'un membre, sinon `claude` (cas des requêtes SQL de Claude via le connecteur).
Conséquence acceptée : une requête faite à la main dans l'éditeur SQL de Supabase est aussi attribuée à `claude`.

Supprimer un ticket supprime aussi ses images : le client les retire par l'API Storage avant de supprimer la ligne (Supabase interdit la suppression directe dans `storage.objects` en SQL).

Données initiales : `members` (les deux comptes Google des membres, e-mails fournis par eux), `projects` (`notia` couleur `oklch(0.55 0.12 202)`, `back-office`).

### Accès de Claude

- **Connecteur MCP Supabase officiel**, installé au niveau utilisateur de Claude Code (`--scope user`) sur la machine de chaque membre, **limité au projet back-office** (`project_ref`) et aux outils base de données. Ainsi il marche depuis n'importe quel repo et n'expose pas le projet notia.
- Claude écrit en SQL dans `tickets` (le trigger enregistre `claude` comme acteur) ; il ne touche ni `members`, ni `projects` sauf demande, ni aux images.
- **Règles d'usage**, à ajouter dans le `CLAUDE.md` de chaque projet concerné (d'abord notia, avec le slug du projet) :
  - le tableau porte les gros sujets des membres ; `tasks/todo.md` reste le carnet de détails de Claude ;
  - consulter le tableau quand un membre en parle ou quand le travail commencé correspond à un ticket ;
  - passer un ticket en « En cours » quand son travail commence, en « Fait » quand la PR est fusionnée (renseigner `link`) ;
  - ne créer un ticket que sur demande ; sinon le proposer en fin de session sans l'ajouter ;
  - ne jamais supprimer un ticket ni changer son responsable.
- Ces règles sont dans le repo de chaque projet, donc partagées entre les deux machines.

### Démarrage

Claude extrait de `notia/tasks/todo.md` et `notia/tasks/Feat_potentiel.md` une quinzaine de gros sujets, les présente aux membres, et n'insère que ceux qu'ils valident.

## Étapes faites par les membres (pas par Claude)

1. Créer une organisation Supabase dédiée en Pro, y inviter le second membre, et créer le projet (région UE).
2. Créer un client OAuth Google pour ce projet Supabase et le renseigner dans Supabase Auth.
3. Créer le repo `Creniaut/backoffice` (ou valider que Claude le crée avec `gh`).
4. Coolify : projet `backoffice`, ressource depuis le repo, domaine, variables de build.
5. IONOS : entrée DNS `todo` vers le VPS.
6. Brancher le connecteur MCP Supabase sur chaque machine (Claude fournit la commande).

## Choix faits par Claude (à vérifier par les membres)

- Carte : indicateur d'images (icône + nombre) plutôt qu'une vignette, pour garder le tableau lisible.
- Ticket partageable par `?ticket=<id>`.
- Suppression d'un ticket autorisée aux membres, avec confirmation.
- Rafraîchissement au retour sur l'onglet au lieu du temps réel.
- Projets ajoutés en SQL en v1.
- Build par Coolify depuis le repo (convention « site simple » du dépôt infra) plutôt que par la CI vers GHCR.
- Développement directement sur le projet Supabase de prod, sans Supabase local ni projet de test.
- Migrations appliquées par chaîne de connexion, sans jeton de compte Supabase sur les machines.

## Laissé au builder

- Structure des dossiers, découpage des composants, nommage.
- Calcul de `position` (fractionnaire ou réindexation) et place d'un ticket déplacé par Claude dans sa colonne.
- Tri de la colonne « Fait » et éventuelle limite d'affichage.
- Forme exacte des politiques RLS et du trigger ; option d'un hook Auth qui refuse la création de comptes hors liste.
- Détail du Dockerfile et de la config nginx.
- Tests : au minimum les fonctions pures (position, filtre) ; vérifier à la main qu'un compte hors liste ne lit rien et ne peut rien envoyer dans le bucket.
