# Deployment to Vercel

## Quick Deploy

### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Vercel will auto-detect Next.js
6. Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd lms-prototype

# Deploy
vercel

# For production
vercel --prod
```

## Important Notes

⚠️ **Current Storage Limitation**: 
- The project uses file-based JSON storage
- On Vercel, the filesystem is **read-only**
- Data writes (create/update/delete) will **not persist**
- Read operations will work fine

**For production**, you need to:
1. Migrate to a database (Vercel Postgres, MongoDB, Supabase, etc.)
2. Update `lib/file-utils.ts` to use database
3. Update API routes accordingly

## Project Configuration

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Environment Variables

No environment variables are currently required, but if you add a database later, configure them in:
Vercel Dashboard → Settings → Environment Variables


