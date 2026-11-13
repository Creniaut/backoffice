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

async function asClaude() {
  await client.query("reset role");
  await client.query("select set_config('request.jwt.claims', '', true)");
}

async function mustFail(name, sql, params = []) {
  await client.query("savepoint attempt");
  try {
    await client.query(sql, params);
  } catch {
    await client.query("rollback to savepoint attempt");
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

  const member = await one("select email from members order by email limit 1");
  assert(member, "Aucun membre : insère d'abord les membres dans members");
  const memberEmail = member.email;

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
  const before = await eventCount(created.id);
  await client.query("update tickets set position = 42 where id = $1", [
    created.id,
  ]);
  assert(
    (await eventCount(created.id)) === before,
    "un changement de position seul crée un événement",
  );
  ok("assignment and edit are logged");
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
