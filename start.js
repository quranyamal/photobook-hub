const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Check your .env file at", __dirname);
  process.exit(1);
}

require("./.next/standalone/server");
