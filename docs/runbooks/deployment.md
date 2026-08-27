# Deployment Runbook

Target: single VPS running Ubuntu 22.04+, Docker 24+, Docker Compose v2.

---

## Prerequisites

- Docker and Docker Compose installed
- Repository cloned to `/opt/photobook-hub`
- `.env` file in place (see Environment Variables below)

---

## Environment Variables

Create `/opt/photobook-hub/.env` with the following values:

```env
# Database — internal Docker network address
DATABASE_URL="postgresql://photobook:photobook@postgres:5432/photobook"

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET="<generated secret>"

# Logging
LOG_LEVEL="info"

# File uploads — stored on the uploads_data named volume
UPLOAD_DIR="/app/.uploads"

# OpenTelemetry — Jaeger running in the same compose stack
OTEL_SERVICE_NAME="photobook-hub"
OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4318"

# Admin seed credentials
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="<strong password>"
```

---

## First Deploy

```bash
cd /opt/photobook-hub

# Build and start all services
docker compose up -d --build

# Seed the admin user
docker compose exec app npx tsx prisma/seed.ts

# Verify the app is healthy
docker compose ps
curl -s http://localhost:3000/api/docs | grep -q "PhotoBook Hub" && echo "OK"
```

---

## Subsequent Deploys (zero-downtime is not required for MVP)

```bash
cd /opt/photobook-hub

# Pull latest code
git pull

# Rebuild and restart the app container only
docker compose up -d --build app

# Migrations run automatically on startup via docker-entrypoint.sh
# Check logs to confirm
docker compose logs app --tail 20
```

---

## Rollback

```bash
# If the new build is broken, revert to the previous image
git stash  # or git checkout <previous-commit>
docker compose up -d --build app
```

---

## Monitoring

| Service | URL | Purpose |
|---|---|---|
| App | http://`<server-ip>`:3000 | Customer-facing site |
| Swagger | http://`<server-ip>`:3000/api/docs | API documentation |
| Jaeger UI | http://`<server-ip>`:16686 | Distributed traces |

Log access:
```bash
docker compose logs app -f          # tail app logs
docker compose logs postgres -f     # tail DB logs
```

---

## Volumes

| Volume | Contents |
|---|---|
| `postgres_data` | PostgreSQL data files — back up regularly |
| `uploads_data` | Customer photo uploads — back up regularly |

Back up uploads:
```bash
docker run --rm -v photobook-hub_uploads_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

---

## Database Operations

Run migrations manually (normally done automatically on startup):
```bash
docker compose exec app node_modules/.bin/prisma migrate deploy
```

Open a psql shell:
```bash
docker compose exec postgres psql -U photobook -d photobook
```

---

## Secrets Rotation

To rotate `AUTH_SECRET`:
1. Update `.env` with a new secret
2. `docker compose up -d app` — all existing sessions will be invalidated
3. Notify users to log in again

To rotate the database password:
1. Update PostgreSQL password inside the container
2. Update `DATABASE_URL` in `.env`
3. Restart the app: `docker compose up -d app`
