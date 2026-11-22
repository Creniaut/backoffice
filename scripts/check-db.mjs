import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant : renseigne-le dans .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const TABLES = [
  "members",
  "projects",
  "tickets",
  "ticket_events",
  "ticket_images",
];
const BUCKET_OBJECTS =
  "select count(*)::int as n from storage.objects where bucket_id = 'ticket-images'";
const INTRUDER = "intrus@example.com";

function ok(name) {
  console.log(`OK ${name}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function one(sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows[0];
}

async function as(email) {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ email, role: "authenticated" }),
  ]);
}

async function asAnon() {
  await client.query("set local role anon");
  await client.query("select set_config('request.jwt.claims', '', true)");
}

async function asClaude() {
  await client.query("reset role");
  await client.query("select set_config('request.jwt.claims', '', true)");
}

async function mustFail(name, sql, params = [], code = "42501") {
  await client.query("savepoint attempt");
  try {
    await client.query(sql, params);
  } catch (error) {
    await client.query("rollback to savepoint attempt");
    assert(
      error.code === code,
      `${name} : refusée pour une autre raison (${error.code} ${error.message})`,
    );
    return;
  }
  throw new Error(`${name} : la requête aurait dû être refusée`);
}

async function lastEvent(ticketId) {
  return one(
    "select actor, kind, detail from ticket_events where ticket_id = $1 order by id desc limit 1",
    [ticketId],
  );
}

async function eventCount(ticketId) {
  return (
    await one(
      "select count(*)::int as n from ticket_events where ticket_id = $1",
      [ticketId],
    )
  ).n;
}

async function run() {
  await client.query("begin");

  const memberEmail = "membre-check@example.com";
  await client.query(
    "insert into members (email, name, initials) values ($1, 'Membre test', 'MT')",
    [memberEmail],
  );

  const seeded = await one(
    "insert into tickets (project_slug, title) values ('notia', 'check-db') returning id",
  );
  await client.query(
    "insert into ticket_images (ticket_id, path) values ($1, 'check-db/x.png')",
    [seeded.id],
  );
  await client.query(
    "insert into storage.objects (bucket_id, name) values ('ticket-images', 'check-db/x.png')",
  );

  await mustFail(
    "uppercase member e-mail",
    "insert into members (email, name, initials) values ('Majuscule@Example.com', 'X', 'X')",
    [],
    "23514",
  );
  ok("member e-mails are lowercase");

  await asAnon();
  for (const table of TABLES) {
    await mustFail(`anon reads ${table}`, `select count(*) from ${table}`);
  }
  assert((await one(BUCKET_OBJECTS)).n === 0, "anon lit le bucket");
  ok("anon sees nothing");
  await asClaude();

  await as(INTRUDER);
  for (const table of TABLES) {
    const { n } = await one(`select count(*)::int as n from ${table}`);
    assert(n === 0, `un compte hors liste lit ${n} ligne(s) de ${table}`);
  }
  assert(
    (await one(BUCKET_OBJECTS)).n === 0,
    "un compte hors liste lit le bucket",
  );
  ok("intruder sees nothing");

  await mustFail(
    "intruder insert ticket",
    "insert into tickets (project_slug, title) values ('notia', 'intrus')",
  );
  await mustFail(
    "intruder upload",
    "insert into storage.objects (bucket_id, name) values ('ticket-images', 'intrus/x.png')",
  );
  const intruderUpdate = await client.query(
    "update tickets set title = 'intrus' where id = $1",
    [seeded.id],
  );
  assert(
    intruderUpdate.rowCount === 0,
    "un compte hors liste modifie un ticket",
  );
  const intruderDelete = await client.query(
    "delete from tickets where id = $1",
    [seeded.id],
  );
  assert(
    intruderDelete.rowCount === 0,
    "un compte hors liste supprime un ticket",
  );
  await mustFail(
    "intruder insert project",
    "insert into projects (slug, name, color) values ('intrus', 'I', 'x')",
  );
  const intruderRename = await client.query(
    "update projects set name = 'intrus' where slug = 'notia'",
  );
  assert(
    intruderRename.rowCount === 0,
    "un compte hors liste renomme un projet",
  );
  ok("intruder cannot write");

  await as(memberEmail);
  for (const table of TABLES) {
    const { n } = await one(`select count(*)::int as n from ${table}`);
    assert(n > 0, `un membre ne lit rien dans ${table}`);
  }
  assert((await one(BUCKET_OBJECTS)).n > 0, "un membre ne lit pas le bucket");
  ok("member reads everything");

  const created = await one(
    "insert into tickets (project_slug, title) values ('notia', 'check-db membre') returning id, last_actor",
  );
  assert(
    created.last_actor === memberEmail,
    `last_actor = ${created.last_actor}`,
  );
  const createdEvent = await lastEvent(created.id);
  assert(
    createdEvent.kind === "created" && createdEvent.actor === memberEmail,
    `événement de création : ${JSON.stringify(createdEvent)}`,
  );
  ok("member writes");

  await client.query(
    "insert into projects (slug, name, color) values ('check-db-projet', 'Check', 'oklch(0.55 0.14 145)')",
  );
  const renamed = await client.query(
    "update projects set name = 'Check 2', color = 'oklch(0.55 0.15 300)' where slug = 'check-db-projet'",
  );
  assert(renamed.rowCount === 1, "un membre ne renomme pas un projet");
  await mustFail(
    "member changes slug",
    "update projects set slug = 'autre' where slug = 'check-db-projet'",
  );
  await mustFail(
    "member deletes project",
    "delete from projects where slug = 'check-db-projet'",
  );
  await client.query(
    "update projects set archived_at = now() where slug = 'check-db-projet'",
  );
  await mustFail(
    "ticket in archived project",
    "insert into tickets (project_slug, title) values ('check-db-projet', 'x')",
    [],
    "P0001",
  );
  await mustFail(
    "ticket moved to archived project",
    "update tickets set project_slug = 'check-db-projet' where id = $1",
    [created.id],
    "P0001",
  );
  await client.query(
    "update projects set archived_at = null where slug = 'check-db-projet'",
  );
  await client.query(
    "insert into tickets (project_slug, title) values ('check-db-projet', 'restauré')",
  );
  ok("member manages projects");

  await asClaude();
  await client.query(
    "update projects set archived_at = now() where slug = 'check-db-projet'",
  );
  await mustFail(
    "claude ticket in archived project",
    "insert into tickets (project_slug, title) values ('check-db-projet', 'x')",
    [],
    "P0001",
  );
  ok("archived project refuses tickets from claude");
  const kept = await client.query(
    "update tickets set project_slug = project_slug, status = 'done' where project_slug = 'check-db-projet'",
  );
  assert(
    kept.rowCount === 1,
    "un ticket d'un projet archivé ne se met plus à jour",
  );
  ok("tickets of an archived project stay editable");
  await as(memberEmail);

  await mustFail(
    "blank project name",
    "insert into projects (slug, name, color) values ('check-db-vide', '   ', 'x')",
    [],
    "23514",
  );
  ok("project names are not blank");

  await mustFail(
    "member writes events",
    "insert into ticket_events (ticket_id, actor, kind) values ($1, 'faux', 'created')",
    [created.id],
  );
  ok("events are read-only for clients");

  await asClaude();
  const moved = await one(
    "update tickets set status = 'doing' where id = $1 returning last_actor",
    [created.id],
  );
  const movedEvent = await lastEvent(created.id);
  assert(
    moved.last_actor === "claude",
    `last_actor après Claude = ${moved.last_actor}`,
  );
  assert(
    movedEvent.kind === "moved" &&
      movedEvent.detail === "doing" &&
      movedEvent.actor === "claude",
    `événement de déplacement : ${JSON.stringify(movedEvent)}`,
  );
  ok("claude is the actor without JWT");

  await client.query("update tickets set assignee_email = $1 where id = $2", [
    memberEmail,
    created.id,
  ]);
  const assigned = await lastEvent(created.id);
  assert(
    assigned.kind === "assigned" && assigned.detail === memberEmail,
    `événement d'attribution : ${JSON.stringify(assigned)}`,
  );
  await client.query("update tickets set title = 'check-db 2' where id = $1", [
    created.id,
  ]);
  assert(
    (await lastEvent(created.id)).kind === "edited",
    "pas d'événement edited",
  );
  const beforePriority = await eventCount(created.id);
  await client.query("update tickets set priority = 'high' where id = $1", [
    created.id,
  ]);
  assert(
    (await eventCount(created.id)) === beforePriority + 1 &&
      (await lastEvent(created.id)).kind === "edited",
    "un changement de priorité n'est pas inscrit comme edited",
  );
  const before = await eventCount(created.id);
  await client.query("update tickets set position = 42 where id = $1", [
    created.id,
  ]);
  assert(
    (await eventCount(created.id)) === before,
    "un changement de position seul crée un événement",
  );
  ok("assignment and edit are logged");

  await checkUserFeedback();
}

const FEEDBACK_PROJECT = "retours-utilisateurs";
const FEEDBACK_SECRET_NAME = "notia_feedback_secret";

async function feedbackSecret() {
  const existing = await one(
    "select decrypted_secret as s from vault.decrypted_secrets where name = $1",
    [FEEDBACK_SECRET_NAME],
  );
  if (existing) return existing.s;
  await client.query("select vault.create_secret($1, $2)", [
    "check-db-secret",
    FEEDBACK_SECRET_NAME,
  ]);
  return "check-db-secret";
}

async function submitAsAnon(secret, title) {
  await asAnon();
  const row = await one(
    "select public.submit_user_feedback($1, $2, 'check-db') as id",
    [secret, title],
  );
  await asClaude();
  return row.id;
}

async function checkUserFeedback() {
  await asClaude();
  const secret = await feedbackSecret();

  await asAnon();
  await mustFail(
    "feedback with a wrong secret",
    "select public.submit_user_feedback('faux', 'Avis · x', 'x')",
    [],
    "PT403",
  );
  await mustFail(
    "feedback with a blank title",
    "select public.submit_user_feedback($1, '   ', 'x')",
    [secret],
    "PT400",
  );
  await mustFail(
    "anon inserts a ticket directly",
    "insert into tickets (project_slug, title) values ('retours-utilisateurs', 'x')",
  );
  await asClaude();
  ok("feedback refuses a wrong secret");

  const old = await one(
    "insert into tickets (project_slug, title, created_at) values ($1, 'vieil avis', now() - interval '13 months') returning id",
    [FEEDBACK_PROJECT],
  );
  const id = await submitAsAnon(secret, "Avis · check-db");
  const ticket = await one(
    "select project_slug, status, title, priority, last_actor from tickets where id = $1",
    [id],
  );
  assert(
    ticket.project_slug === FEEDBACK_PROJECT &&
      ticket.status === "idea" &&
      ticket.title === "Avis · check-db" &&
      ticket.priority === null,
    `ticket d'avis : ${JSON.stringify(ticket)}`,
  );
  assert(
    !(await one("select 1 as x from tickets where id = $1", [old.id])),
    "un avis de plus d'un an n'est pas supprimé",
  );
  ok("feedback creates an idea and purges year-old ones");

  const { n } = await one(
    "select count(*)::int as n from tickets where project_slug = $1 and created_at > now() - interval '1 hour'",
    [FEEDBACK_PROJECT],
  );
  for (let i = n; i < 50; i += 1) {
    await client.query(
      "insert into tickets (project_slug, title) values ($1, 'check-db plafond')",
      [FEEDBACK_PROJECT],
    );
  }
  await asAnon();
  await mustFail(
    "feedback over the hourly cap",
    "select public.submit_user_feedback($1, 'Avis · trop', 'x')",
    [secret],
    "PT429",
  );
  await asClaude();
  ok("feedback is capped at 50 per hour");
}

try {
  await client.connect();
  await run();
  console.log("Toutes les vérifications passent.");
} catch (error) {
  console.error(`ÉCHEC ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.query("rollback").catch(() => {});
  await client.end();
}
