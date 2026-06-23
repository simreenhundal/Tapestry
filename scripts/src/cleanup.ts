import { pool } from "@workspace/db";

async function cleanup() {
  const result = await pool.query("DELETE FROM employees WHERE id < 3 RETURNING name");
  console.log(`Deleted ${result.rowCount} old test entries:`, result.rows.map((r: { name: string }) => r.name));
  await pool.end();
}

cleanup().catch((err) => { console.error(err); process.exit(1); });
