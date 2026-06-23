---
name: api-zod index exports
description: lib/api-zod/src/index.ts must be manually updated after OpenAPI schema changes
---

The file `lib/api-zod/src/index.ts` has two parts:
1. `export * from "./generated/api"` — auto-generated Zod schemas (safe to leave as-is)
2. `export type { ... } from "./generated/types"` — manually curated TypeScript interface re-exports

**Why:** Orval generates both files, but the index.ts re-exports are hand-maintained. When you rename or remove a top-level schema from openapi.yaml, the generated types file changes but index.ts is not auto-updated — causing typecheck failures like "Module has no exported member 'X'".

**How to apply:** After running `pnpm --filter @workspace/api-spec run codegen`, if typecheck:libs fails with "no exported member", open `lib/api-zod/src/generated/types` to see what interfaces exist, then update `lib/api-zod/src/index.ts` to match.
