# Deployment Guide

## Prerequisites

- Node.js 20+
- Supabase project (database + auth + storage)
- Vercel account (recommended) or any Node.js hosting

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the **required** variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`
   - `ENCRYPTION_SECRET` / `ENCRYPTION_SALT` - Any strong random strings
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://kawadir.io`)
   - `NEXT_PUBLIC_ROOT_DOMAIN` - Root domain (e.g., `kawadir.io`)

## Database Setup

1. Run all SQL migrations in order against your Supabase project:
   ```bash
   ls supabase/migrations/*.sql | sort | while read f; do
     echo "Running $f..."
     # Apply via Supabase SQL Editor or CLI
   done
   ```

2. Or use the Supabase CLI:
   ```bash
   supabase db push
   ```

## Vercel Deployment

1. Connect your repository to Vercel
2. Set all environment variables in Vercel dashboard (Settings > Environment Variables)
3. Deploy:
   ```bash
   vercel --prod
   ```

### Custom Domain Setup

1. Add your domain in Vercel (Settings > Domains)
2. Configure wildcard DNS: `*.yourdomain.com` pointing to Vercel
3. Update `NEXT_PUBLIC_ROOT_DOMAIN` to your domain

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR:

1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compilation
3. **Test** - Jest test suite
4. **Build** - Next.js production build

All four must pass before merging.

## Health Check

The platform exposes a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "server": "ok",
    "database": "ok"
  },
  "timestamp": "2026-02-15T12:00:00.000Z",
  "version": "abc123"
}
```

Use this for uptime monitoring (e.g., UptimeRobot, Vercel Cron).

## Storage Buckets

Ensure these Supabase Storage buckets exist (created by migrations):

| Bucket | Purpose |
|--------|---------|
| `organization-assets` | Logos, avatars, branding images |
| `resumes` | Candidate resumes |
| `documents` | General document storage |
| `logos` | Platform-level logos |

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Storage buckets created with RLS policies
- [ ] Health check returns `healthy`
- [ ] Login/signup flow works
- [ ] Email sending works (test via org settings)
- [ ] File uploads work (test via profile avatar)
- [ ] Custom domain resolves correctly (if configured)
- [ ] Sentry error monitoring active (check dashboard)

## Monitoring

- **Errors**: Sentry (configure `NEXT_PUBLIC_SENTRY_DSN`)
- **Health**: `/api/health` endpoint
- **Logs**: Vercel Functions logs (or your hosting provider)

## Security Notes

- All API routes have rate limiting (auth: 10/min, AI: 10/min, uploads: 15/min, general: 30/min)
- Security headers are configured in `next.config.ts` (CSP, HSTS, X-Frame-Options, etc.)
- Sensitive credentials are encrypted at rest using AES-256-GCM
- Row-Level Security (RLS) is enabled on all database tables
- File uploads are validated for type and size server-side
