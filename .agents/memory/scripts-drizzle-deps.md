---
name: scripts drizzle-orm imports
description: scripts/src/ cannot import drizzle-orm or pg directly — use @workspace/db exports
---

The `@workspace/scripts` package only has `@workspace/db` as a dependency. Scripts that try to `import { sql, lt, eq } from 'drizzle-orm'` will fail at runtime with ERR_MODULE_NOT_FOUND even though drizzle-orm is in the pnpm catalog — because it's not a direct dependency of scripts.

**Why:** ESM module resolution in tsx does not hoist workspace dependencies. Each package needs explicit deps.

**How to apply:**
- For Drizzle query operations: import `db` and `employeesTable` from `@workspace/db`, use `db.select()`, `db.insert()`, etc. — these work fine
- For raw SQL: import `pool` from `@workspace/db` and call `pool.query(sql_string)` directly
- If you genuinely need drizzle helper imports (sql, eq, lt, etc.), add `drizzle-orm: catalog:` to `scripts/package.json` dependencies and run `pnpm install`
