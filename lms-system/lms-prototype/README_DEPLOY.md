# Vercel Deployment Guide

## Important Notes

⚠️ **Current Limitation**: This project uses file-based storage (JSON files) which is **read-only** on Vercel's serverless functions. 

- ✅ **Read operations** will work (viewing data)
- ❌ **Write operations** (create, update, delete) will NOT persist on Vercel

### For Production Deployment

You will need to migrate to a database solution such as:
- Vercel Postgres
- MongoDB Atlas
- Supabase
- Firebase
- Other cloud databases

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"

3. **Import your repository**:
   - Select your repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

4. **Configure Project Settings** (if needed):
   - Framework Preset: Next.js
   - Root Directory: `lms-prototype` (if your Next.js app is in a subdirectory)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to project directory**:
   ```bash
   cd lms-prototype
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Follow the prompts**:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No**
   - Project name? (Press Enter for default)
   - Directory? **./lms-prototype** or **.** (depending on your structure)
   - Override settings? **No**

6. **For production deployment**:
   ```bash
   vercel --prod
   ```

## Environment Variables

If you need environment variables later, add them in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

## Post-Deployment

1. **Test the deployment**:
   - Visit your Vercel URL
   - Test read operations (viewing data should work)
   - Note: Write operations will fail silently

2. **Monitor logs**:
   - Vercel Dashboard → Your Project → Deployments → Functions → Logs

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify TypeScript errors are resolved
- Check build logs in Vercel dashboard

### API Routes Not Working
- Ensure API routes are in `app/api/` directory
- Check that routes export proper HTTP methods (GET, POST, etc.)
- Verify file paths are correct

### Data Not Persisting
- This is expected with current file-based storage
- Migrate to a database solution for production use

## Next Steps for Production

1. Set up a database (Vercel Postgres, MongoDB, etc.)
2. Update `lib/file-utils.ts` to use database instead of file system
3. Update API routes to use database queries
4. Set up environment variables for database connection
5. Re-deploy with database integration


