#!/bin/bash

# Production deployment script

echo "🚀 Starting production deployment..."

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ Error: NEXTAUTH_SECRET is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗃️  Running database migrations..."
npm run db:migrate:deploy

# Build the application
echo "🏗️  Building application..."
npm run build

echo "✅ Deployment completed successfully!"
