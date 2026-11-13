# CLAUDE.md — back-office Creniaut

Lire aussi `README.md` et la conception `docs/superpowers/specs/2026-11-13-tableau-design.md`.

## Conventions

- Réponses en français ; code et identifiants en anglais ; **pas de commentaires dans le code** ; textes de l'interface en français.
- TypeScript strict, pas de `any`. `npm run lint`, `npm run check-types` et `npm test` doivent passer (CI).
- Toute requête Supabase passe par `src/board/api.ts` ; les composants n'importent pas le client Supabase (sauf `src/auth/`).
- Couleurs et polices : tokens du thème (`app.*`, `status.*`) dans `src/theme.ts`, tirés de la maquette `docs/maquette-tableau.html`.
- Évolution de la base : nouvelle migration dans `supabase/migrations/`, relue, puis `npx supabase db push --db-url "$DATABASE_URL"` et `npm run check:db`.

## Tableau du back-office (connecteur `supabase-backoffice`)

Slug de ce projet : `back-office`.

- Le tableau porte les **gros sujets** des membres, pas les petites tâches.
- Le consulter quand un membre en parle, ou quand le travail commencé correspond à un ticket.
- Passer un ticket en « En cours » quand son travail commence, en « Fait » quand la PR est fusionnée (renseigner `link`).
- Ne créer un ticket que sur demande ; sinon le proposer en fin de session sans l'ajouter.
- Ne jamais supprimer un ticket ni changer son responsable. Ne pas toucher à `members`, `projects` ni aux images sans demande.

```sql
select id, title, status, assignee_email from tickets
where project_slug = 'back-office' and status <> 'done' order by status, position;

update tickets set status = 'doing',
  position = (select coalesce(min(position), 0) - 1 from tickets where status = 'doing')
where id = <id>;

update tickets set status = 'done', link = '<url de la PR>',
  position = (select coalesce(min(position), 0) - 1 from tickets where status = 'done')
where id = <id>;
```
