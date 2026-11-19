# CLAUDE.md — back-office Creniaut

Lire aussi `README.md` et la conception `docs/superpowers/specs/2026-11-13-tableau-design.md`.

## Conventions

- Réponses en français ; code et identifiants en anglais ; **pas de commentaires dans le code** ; textes de l'interface en français.
- TypeScript strict, pas de `any`. `npm run lint`, `npm run check-types` et `npm test` doivent passer (CI).
- Toute requête Supabase passe par `src/board/api.ts` ; les composants n'importent pas le client Supabase (sauf `src/auth/`).
- Couleurs et polices : tokens du thème (`app.*`, `status.*`) dans `src/theme.ts`, tirés des maquettes `docs/maquette-tableau.html` et `docs/maquette-filtres.html`.
- Évolution de la base : nouvelle migration dans `supabase/migrations/`, relue, puis `npx supabase db push --db-url "$DATABASE_URL"` et `npm run check:db`.
- Un plan d'implémentation (`docs/superpowers/plans/`) se supprime dans la PR qui le termine ; la spec reste comme référence.

## Tableau du back-office (connecteur `supabase-backoffice`)

Ce repo range ses tickets dans deux projets :

- `todo` : le tableau lui-même (todo.notias.fr) — interface, schéma, déploiement ;
- `back-office` : le reste du back-office (autres modules à venir, sujets communs).

Dans les requêtes ci-dessous, remplacer `<slug>` par l'un des deux.

Ce repo fait évoluer le code et le schéma du tableau ; les autres projets y lisent et écrivent leurs tickets par le connecteur
(section modèle dans `README.md`, « Brancher un projet sur le tableau »).

- Le tableau est le seul suivi de ce qui reste à faire : features, fixes, chantiers. Pas de fichier de todo à côté.
- Dès qu'on parle d'une feature ou d'un fix à faire plus tard, ou qu'on en repère un en travaillant, sans attendre qu'on le demande :
  chercher un ticket qui en parle déjà et le mettre à jour (description, colonne), sinon en créer un.
  « Idées » pour une piste pas encore décidée, « À faire » pour un travail décidé. Le signaler dans la réponse (titre et colonne).
- Au début d'un travail, chercher le ticket qui y correspond et le passer en « En cours ».
- Quand le travail est sur `main` : le ticket passe en « Fait » avec son `link` (la PR fusionnée, ou le commit sans PR :
  `https://github.com/Creniaut/<repo>/commit/<sha>`, affiché « Commit abc1234 » sur la carte).
  Une décision qui compte (choix, compromis, raison d'une contrainte) va dans `README.md` ou dans la spec du tableau
  (`docs/superpowers/specs/2026-11-13-tableau-design.md`). Pas de journal de ce qui est fait : le tableau et les PR en tiennent lieu.
- Titre court qui dit ce qui change. Description : le besoin et la piste en 1 à 3 phrases, puis le détail utile au travail
  en liste `- [ ]` (fichiers, réglages, cas à vérifier), cochée `- [x]` au fil du travail.
  Une petite tâche se range de préférence dans le ticket du sujet qu'elle sert.
- Priorité et difficulté à chaque ticket créé, à revoir si le sujet change : `priority` (`high`, `medium`, `low`) dit l'urgence,
  `difficulty` (`easy`, `medium`, `hard`) l'effort.
- Ne jamais supprimer un ticket ni changer son responsable. Ne pas toucher à `members`, `projects` ni aux images sans demande.
- Tableau injoignable (outils `supabase-backoffice` absents, « Needs authentication », erreur d'accès) : le dire tout de suite,
  sans passer par `DATABASE_URL` pour les tickets, et donner la marche à suivre de `README.md`, « Si le tableau ne répond pas »
  (diagnostic : `claude mcp get supabase-backoffice`). En attendant, lister en fin de réponse les tickets à créer ou à déplacer.

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
