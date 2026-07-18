# Deployment Guide

This guide covers deploying the Office Desk Booking System to production using free tiers.

## Overview

**Deployment Stack (100% Free)**:
- **Database**: Supabase or Neon (PostgreSQL)
- **Frontend & API**: Vercel
- **Total Cost**: $0/month

## Prerequisites

- [ ] GitHub account
- [ ] Supabase or Neon account
- [ ] Vercel account
- [ ] Code pushed to GitHub repository

## Step 1: Prepare Database

### Option A: Supabase (Recommended)

1. Go to your Supabase project
2. Ensure extensions are enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy production connection string:
   - Go to **Settings** → **Database**
   - Use **Connection pooling** → **Session mode**
   - Copy the URI

### Option B: Neon

1. Go to your Neon project
2. Ensure extensions are enabled
3. Copy connection string from dashboard

## Step 2: Run Production Migrations

On your local machine:

```bash
# Set production database URL
export DATABASE_URL="your-production-connection-string"

# Run migrations
npm run db:migrate:deploy

# Seed database (optional)
npm run db:seed
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default

5. Add Environment Variables:

   Click **Environment Variables** and add:

   ```
   DATABASE_URL = your-production-connection-string
   NEXTAUTH_URL = https://your-app.vercel.app
   NEXTAUTH_SECRET = generate-new-secret-for-production
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   NODE_ENV = production
   ```

   **Important**: Generate a NEW `NEXTAUTH_SECRET` for production:
   ```bash
   openssl rand -base64 32
   ```

6. Click **Deploy**

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? office-desk-booking
# - Directory? ./
# - Override settings? N

# Set environment variables
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add NEXTAUTH_SECRET production
# Paste your production secret

vercel env add NEXTAUTH_URL production
# Enter: https://your-app.vercel.app

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-app.vercel.app

# Deploy to production
vercel --prod
```

## Step 4: Verify Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test login with seeded credentials
3. Test booking flow
4. Check admin dashboard
5. Verify recommendations work

## Step 5: Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as shown
4. Update environment variables:
   ```
   NEXTAUTH_URL = https://yourdomain.com
   NEXT_PUBLIC_APP_URL = https://yourdomain.com
   ```

## Production Checklist

- [ ] Database extensions enabled
- [ ] Production migrations applied
- [ ] All environment variables set in Vercel
- [ ] NEXTAUTH_SECRET is production-specific (not dev secret)
- [ ] Application accessible at Vercel URL
- [ ] Login works
- [ ] Bookings can be created
- [ ] Admin features work
- [ ] SSL certificate active (automatic with Vercel)

## Monitoring & Maintenance

### View Logs

**Vercel Logs**: 
- Go to your project → **Deployments** → select deployment → **Logs**

**Database Logs**:
- **Supabase**: Project → **Logs** → **Database**
- **Neon**: Project → **Operations**

### Monitor Performance

**Vercel Analytics** (free tier available):
1. Enable in project settings
2. View at **Analytics** tab

### Database Backups

**Supabase**: 
- Automatic daily backups on all plans
- Download via **Database** → **Backups**

**Neon**:
- Point-in-time restore available
- Branch your database for testing

## Scaling Considerations

### Free Tier Limits

**Vercel**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic scaling

**Supabase**:
- 500 MB database
- 2 GB bandwidth/month
- 50,000 monthly active users

**Neon**:
- 512 MB storage
- Always-available compute

### When to Upgrade

Upgrade when you reach:
- Database storage limit (500 MB)
- Bandwidth limit (2 GB/month)
- Need longer log retention
- Need more team members

**Supabase Pro**: $25/month
- 8 GB database
- 50 GB bandwidth
- 7 day log retention

**Neon Scale**: Pay-as-you-go
- More storage
- Higher compute

## Troubleshooting

### Issue: 500 Error on Deployment

**Check**:
1. Vercel logs for error details
2. DATABASE_URL is correct
3. Database is accessible
4. Migrations were applied

**Fix**:
```bash
# Re-run migrations
export DATABASE_URL="production-url"
npm run db:migrate:deploy
```

### Issue: Authentication Not Working

**Check**:
1. NEXTAUTH_URL matches actual URL
2. NEXTAUTH_SECRET is set
3. Cookies are being set (check browser DevTools)

### Issue: Database Connection Errors

**Check**:
1. Supabase/Neon project is active
2. Connection string in Vercel env vars
3. Use connection pooling mode
4. IP allowlist (some providers)

**Supabase**: Enable "connection pooling" in settings

### Issue: Slow API Responses

**Optimize**:
1. Add database indexes (already in schema)
2. Use Vercel Edge Functions (if needed)
3. Enable caching headers
4. Optimize Prisma queries

## Security Best Practices

- [ ] NEXTAUTH_SECRET is random and secure
- [ ] DATABASE_URL uses SSL
- [ ] Environment variables are not in code
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set (in next.config.js)
- [ ] Regular dependency updates

## Updating Production

```bash
# 1. Push changes to GitHub
git add .
git commit -m "Update feature"
git push origin main

# 2. Vercel auto-deploys from main branch

# 3. If database schema changed:
export DATABASE_URL="production-url"
npm run db:migrate:deploy
```

## Rollback

If deployment has issues:

1. Go to Vercel → **Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Neon: [neon.tech/docs](https://neon.tech/docs)

## Cost Estimation

**Free Tier (0-500 users)**:
- Vercel: $0
- Supabase/Neon: $0
- **Total: $0/month**

**Paid Tier (500-5000 users)**:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- **Total: $45/month**

**Enterprise (5000+ users)**:
- Contact providers for custom pricing
- Consider self-hosting on AWS/GCP

---

You're now live in production! 🚀
