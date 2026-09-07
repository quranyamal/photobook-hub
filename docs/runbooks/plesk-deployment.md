# Plesk Deployment Runbook

Target: Managed Plesk hosting with no root access, Plesk-managed PostgreSQL, Plesk Node.js extension.

Jaeger tracing is not available without Docker — omit `OTEL_EXPORTER_OTLP_ENDPOINT` and the app degrades gracefully.

---

## Prerequisites

- Plesk panel access for your domain
- **Node.js extension** installed and active in Plesk (Plesk → Extensions → Node.js)
- **PostgreSQL extension** active in Plesk
- Domain or subdomain already pointed to the server in Plesk
- SSH or Plesk terminal access (available in most managed Plesk plans under domain → SSH Terminal)

---

## First Deploy

### 1. Create the database

Plesk panel → **Databases** → **Add Database**:

| Field | Value |
|---|---|
| Database name | `photobook_hub` |
| Type | PostgreSQL |
| User | create a dedicated user (e.g., `pbh_user`) |
| Password | generate a strong password |

Note the connection details. The connection string will be:

```
postgresql://pbh_user:YOUR_PASSWORD@localhost:5432/photobook_hub
```

> The host is `localhost` for Plesk-managed PostgreSQL. Port is always `5432`.

---

### 2. Configure the Node.js app in Plesk

Plesk → your domain → **Node.js** tab:

| Setting | Value |
|---|---|
| Node.js version | **20.x LTS** (or higher) |
| Application mode | Production |
| Application root | `/` (the domain's `httpdocs` folder) |
| Application startup file | `.next/standalone/server.js` |

Click **Enable Node.js**, then **Save**. Plesk assigns a port and configures Nginx to proxy to it automatically.

---

### 3. Upload the code

**Option A — Git (recommended)**

Plesk → domain → **Git** tab:
- Remote URL: your GitHub / GitLab repository URL
- Deployment branch: `main`
- Click **Pull**

Plesk clones the repo into the application root.

**Option B — SFTP**

Connect via SFTP using your Plesk FTP credentials and upload the project to `httpdocs/`.

---

### 4. Set environment variables

Plesk → domain → **Node.js** → **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://pbh_user:PASSWORD@localhost:5432/photobook_hub` |
| `AUTH_SECRET` | Run `openssl rand -base64 32` locally and paste the result |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `UPLOAD_DIR` | `/var/www/vhosts/yourdomain.com/httpdocs/.uploads` |
| `ADMIN_EMAIL` | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | A strong password for the initial admin account |

> Do **not** set `OTEL_EXPORTER_OTLP_ENDPOINT` — leaving it unset disables tracing cleanly.

> Use an **absolute path** for `UPLOAD_DIR`. The relative `.uploads` default does not survive across restarts reliably on Plesk.

---

### 5. Build and prepare the app

Open **Plesk SSH Terminal** (domain → SSH Terminal) or connect via SSH, then run:

```bash
cd ~/httpdocs   # or wherever your app root is

# Install dependencies (Plesk uses npm; pnpm lockfile is ignored)
npm install

# Generate Prisma client
npx prisma generate

# Build (outputs .next/standalone/ because of output: 'standalone' in next.config.ts)
npx next build

# Copy static assets into the standalone folder (required for Next.js standalone)
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public

# Run database migrations
npx prisma migrate deploy
```

---

### 6. Seed the admin user

```bash
npx tsx prisma/seed.ts
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are read from the environment variables set in step 4.

---

### 7. Start the app

Plesk → domain → **Node.js** → click **Restart**.

Plesk starts `.next/standalone/server.js` and Nginx begins proxying requests to it.

**Verify:** visit `https://yourdomain.com` — the homepage should load. Log in at `/login` with the admin credentials to confirm database connectivity.

---

### 8. Enable SSL (HTTPS)

Plesk → domain → **SSL/TLS Certificates** → **Let's Encrypt** → issue a free certificate. Renewal is automatic.

---

## Subsequent Deploys

```bash
cd ~/httpdocs

# Pull latest code
git pull

npm install
npx prisma generate
npx next build

cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public

npx prisma migrate deploy
```

Then in Plesk: **Node.js → Restart**.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| 502 Bad Gateway | App failed to start — check Plesk → Node.js → View Logs |
| `DATABASE_URL` error on startup | Verify the connection string in Plesk env vars; test with `npx prisma db pull` |
| Static assets (CSS/JS) not loading | Re-run the `cp -r` commands in step 5 |
| `AUTH_SECRET` error | Ensure `AUTH_SECRET` is set and is at least 32 characters |
| Uploads not persisting | Confirm `UPLOAD_DIR` is an absolute path with write permissions |

---

## Backup

Back up regularly:
- **Database**: Plesk → Databases → Backup (or `pg_dump photobook_hub > backup.sql`)
- **Uploads**: the `UPLOAD_DIR` folder (customer photos)
