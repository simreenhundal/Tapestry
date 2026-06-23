import { pool } from "@workspace/db";

async function migrate() {
  console.log("Applying schema migration...");

  await pool.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS company text DEFAULT ''`);
  console.log("  ✓ Added company column");

  await pool.query(`ALTER TABLE employees ALTER COLUMN preferred_work_days DROP DEFAULT`);
  await pool.query(`
    ALTER TABLE employees
    ALTER COLUMN preferred_work_days TYPE text[]
    USING string_to_array(preferred_work_days, ',')
  `);
  await pool.query(`ALTER TABLE employees ALTER COLUMN preferred_work_days SET DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri']`);
  console.log("  ✓ Converted preferred_work_days to text[]");

  console.log("Migration complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
