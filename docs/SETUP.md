# Setup Guide

This guide will walk you through setting up the Office Desk Booking System from scratch.

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Database provider account (Supabase/Neon) OR local PostgreSQL

## Step-by-Step Setup

### 1. Get the Code

```bash
# Clone the repository
git clone <your-repo-url>
cd Office-Desk-Booking-System

# Install dependencies
npm install
```

### 2. Set Up Database

#### Using Supabase (Recommended for Beginners)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
5. Fill in:
   - **Name**: desk-booking
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
6. Wait for project to be ready (~2 minutes)
7. Go to **Settings** → **Database**
8. Copy the **Connection string** (URI mode)
9. In SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   (PostGIS is already enabled)

#### Using Neon

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create new project
3. Copy the connection string
4. In the SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` in your text editor and update:

```env
# Replace with your Supabase/Neon connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Generate a secret key
# On Mac/Linux: openssl rand -base64 32
# On Windows PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
NEXTAUTH_SECRET="paste-generated-secret-here"

# Keep these as-is for local development
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

You should see output like:
```
Starting seed...
Created admin user: admin@company.com
Created teams
Created test users
...
Seed completed successfully!
```

### 5. Start Development Server

```bash
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 6. Access the Application

1. Open browser to [http://localhost:3000](http://localhost:3000)
2. You should see the login page
3. Login with:
   - **Email**: `admin@company.com`
   - **Password**: `Admin123!`

### 7. Verify Everything Works

- [ ] Can login successfully
- [ ] See the "Find a Desk" page
- [ ] Can select date/time and get recommendations
- [ ] Can book a desk
- [ ] Can view bookings at `/bookings`
- [ ] Admin can access `/admin` dashboard

## Common Issues

### Issue: "Can't connect to database"

**Solution**: 
1. Check that DATABASE_URL is correct in `.env`
2. Ensure your IP is allowed in Supabase/Neon dashboard
3. Test connection: `npx prisma db pull`

### Issue: "Extension 'postgis' or 'vector' not found"

**Solution**:
```sql
-- Run in Supabase/Neon SQL editor
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Prisma client errors

**Solution**:
```bash
# Regenerate Prisma client
npm run db:generate
```

### Issue: Migration errors

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then re-run migrations and seed
npm run db:migrate
npm run db:seed
```

## Next Steps

1. **Customize the application**
   - Update branding in `components/Layout.tsx`
   - Modify colors in `tailwind.config.js`
   - Add your company logo

2. **Add more users and teams**
   - Register new users at `/auth/register`
   - Or add via database seed script

3. **Configure your office layout**
   - Add offices, floors, zones via admin API
   - Add desks with spatial coordinates

4. **Deploy to production** (see Deployment Guide)

## Development Workflow

```bash
# Start dev server
npm run dev

# Check types
npm run type-check

# Run linting
npm run lint

# View database in GUI
npm run db:studio
```

## Getting Help

- Check the [main README](README.md)
- Review [API Documentation](docs/API.md)
- Open a GitHub issue

## You're All Set! 🎉

The system is now running locally. Start exploring the features and customizing it for your needs.
