# CareForVets Portal — BUILD v2

Authenticated portal scaffold for the CareForVets veteran services network.

## Development boundary
This portal is intentionally **non-PHI**. Do not enter diagnoses, medications, assessments, medical-record identifiers, clinical histories, or other protected health information.

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Required environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only a Supabase publishable key belongs in browser code. Never expose a Supabase service-role key in the portal.

## Current routes
- `/dashboard`
- `/login`
- `/care`
- `/careers`
- `/resources`
- `/partners`

## Deployment
The intended production hostname is `portal.careforvets.com` using a second Netlify project whose base directory is `portal/`.
