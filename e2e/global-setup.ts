import { execSync } from "node:child_process";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://photobook:photobook@localhost:5432/photobook_test";

export default async function globalSetup() {
  // Apply all pending migrations to the test database
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });

  const pool = new Pool({ connectionString: TEST_DB_URL });
  try {
    // Wipe all rows so each run starts clean (CASCADE handles FK order)
    await pool.query('TRUNCATE "users" CASCADE');

    // Seed admin user
    const hashedPassword = await hash("Admin123!", 12);
    await pool.query(
      `INSERT INTO users (id, email, name, "hashedPassword", role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', now(), now())`,
      ["admin@e2e.test", "E2E Admin", hashedPassword]
    );

    console.log("✓ Test database ready");
  } finally {
    await pool.end();
  }
}
