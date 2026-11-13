export interface FakeResult {
  data: unknown;
  error: { message: string } | null;
}

interface FakeQuery extends PromiseLike<FakeResult> {
  select(columns?: string): FakeQuery;
  insert(value: unknown): FakeQuery;
  update(value: unknown): FakeQuery;
  delete(): FakeQuery;
  eq(column: string, value: unknown): FakeQuery;
  order(column: string, options?: unknown): FakeQuery;
  single(): FakeQuery;
  maybeSingle(): FakeQuery;
}

export function createFakeSupabase() {
  const calls: string[] = [];
  const payloads = new Map<string, unknown>();
  const results = new Map<string, FakeResult>();
  const resultFor = (key: string): FakeResult =>
    results.get(key) ?? { data: null, error: null };

  function from(table: string): FakeQuery {
    let op = "select";
    const filters: string[] = [];
    const query: FakeQuery = {
      select: () => query,
      insert: (value) => {
        op = "insert";
        payloads.set(`insert ${table}`, value);
        return query;
      },
      update: (value) => {
        op = "update";
        payloads.set(`update ${table}`, value);
        return query;
      },
      delete: () => {
        op = "delete";
        return query;
      },
      eq: (_column, value) => {
        filters.push(String(value));
        return query;
      },
      order: () => query,
      single: () => query,
      maybeSingle: () => query,
      then: (resolve, reject) => {
        const key = `${op} ${table}`;
        calls.push([key, ...filters].join(" "));
        return Promise.resolve(resultFor(key)).then(resolve, reject);
      },
    };
    return query;
  }

  const bucket = {
    remove: async (paths: string[]) => {
      calls.push(`storage.remove ${paths.join(",")}`);
      return resultFor("storage.remove");
    },
    upload: async (path: string) => {
      calls.push(`storage.upload ${path}`);
      return resultFor("storage.upload");
    },
    createSignedUrls: async (paths: string[], expiresIn: number) => {
      calls.push(`storage.sign ${paths.join(",")} ${expiresIn}`);
      return resultFor("storage.sign");
    },
  };

  return {
    calls,
    payloads,
    results,
    reset() {
      calls.length = 0;
      payloads.clear();
      results.clear();
    },
    from,
    storage: { from: () => bucket },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
