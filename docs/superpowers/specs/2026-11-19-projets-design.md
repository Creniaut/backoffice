# Créer, renommer et archiver les projets — conception

Statut : validée le 2026-11-19 (option B, fenêtre « Projets »). Ticket #64.

## Pourquoi

Un projet n'est pas forcément un repo : c'est un sujet sur lequel on range des tickets (par exemple l'outil de todo lui-même, distinct du back-office). Aujourd'hui un projet s'ajoute en SQL ; le créer, le renommer ou le ranger depuis l'interface rend le tableau plus fluide.

## Ce qui change

- **Bouton « Projets »** au bout des onglets de projets (`ProjectFilter`). Il ouvre une fenêtre « Projets », construite comme `NewTicketDialog` (mêmes tokens `app.*`) :
  - en haut, **Nouveau projet** : champ Nom, pastilles de couleur, bouton « Créer ». Sous le nom, l'adresse calculée (`Adresse : /todo/<slug>`). Après création, la fenêtre se ferme et le tableau s'ouvre sur `/todo/<slug>` ;
  - la **liste des projets actifs** : pastille, nom, nombre de tickets, boutons « Modifier » (nom et couleur éditables dans la ligne, « Enregistrer » / « Annuler ») et « Archiver » ;
  - une section repliée **Archivés (n)** : mêmes lignes avec « Restaurer ».
- **Slug** : calculé à la création depuis le nom (minuscules, accents retirés, tout autre caractère que `a-z0-9` remplacé par `-`, tirets en double et en bord retirés), puis **figé**. Renommer ne change que le nom : le slug sert dans l'adresse `/todo/<slug>` et dans le `CLAUDE.md` des repos branchés.
- **Couleur** : palette fixe de 6 à 8 teintes `oklch` dans la gamme des couleurs existantes (`src/board/`), la première non utilisée par un projet actif est cochée par défaut.
- **Erreurs** : nom vide ou slug vide → « Créer » / « Enregistrer » grisé ; slug déjà pris (projet actif ou archivé) → « Ce projet existe déjà » sous le champ, contrôlé côté client et retour de la base (clé primaire) affiché pareil.
- **Archiver** : colonne `projects.archived_at timestamptz` (nulle = actif). Un projet archivé disparaît des onglets, de « Tous les projets » (ses tickets ne sont plus affichés ni comptés) et du sélecteur de « Nouveau ticket ». Son adresse `/todo/<slug>` revient à « Tous les projets ». Ses tickets restent en base, intacts. « Restaurer » remet `archived_at` à nul.
- **Base** (nouvelle migration) :
  - `archived_at` ;
  - `grant insert` et `grant update (name, color, archived_at)` sur `projects` aux `authenticated`, politiques `projects_insert` / `projects_update` sur `is_member()` ; pas de `delete`, pas de changement de `slug` ;
  - déclencheur sur `tickets` : refuse l'insertion d'un ticket, ou son déplacement par `project_slug`, vers un projet archivé (y compris par Claude via le connecteur) ;
  - `scripts/check-db.mjs` vérifie ces droits et ce refus.
- **Code** : `createProject`, `updateProject` (nom, couleur, archivage) dans `src/board/api.ts`, mutations dans `queries.ts` qui rechargent le tableau ; `Project` gagne `archivedAt`. Le chargement du tableau garde tous les projets ; le filtrage des archivés se fait côté client.
- **Doc** : `README.md` (« Ajouter un projet », « Brancher un projet ») renvoie à la fenêtre Projets ; la requête SQL reste en secours.

## Approches écartées

- A, créer le projet depuis « Nouveau ticket » : plus fluide pour un ticket, mais aucun endroit pour renommer ou archiver.
- Bouton « + » seul : suffisait pour créer, pas pour trois actions.
- Slug modifiable au renommage : casserait les liens et les requêtes des agents dans les autres repos.

## Hors sujet

Supprimer un projet ; réordonner les onglets ; droits par projet ; membres par projet.
