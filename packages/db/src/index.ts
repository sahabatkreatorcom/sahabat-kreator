import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index";

let _db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    // Read DATABASE_URL lazily so this module can be imported (e.g. by Next.js
    // during page-data collection) without triggering env validation at import
    // time. Full env validation still happens in server/worker entrypoints.
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is not set. Ensure the environment is configured before using the database.",
      );
    }
    _db = drizzle(databaseUrl, { schema });
  }
  return _db;
}

// Server-only compat: `import { db } from '@sahabatkreator/db'` returns a proxy
// that delegates property access to the real db once getDb() is called.
export const db = new Proxy(
  {},
  {
    get(_target, prop, _receiver) {
      return Reflect.get(getDb(), prop);
    },
  },
) as unknown as NodePgDatabase<typeof schema>;

export { schema };
