// Loads .env before starting the Next.js standalone server.
// Required for Plesk hosting where env vars are not injected into the process.
require("dotenv").config();
require("./.next/standalone/server");
