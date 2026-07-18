# Office Desk Booking System

A production-ready, full-stack office desk booking system with advanced AI-powered recommendations based on spatial proximity to teammates and feature preference matching.

## 🌟 Features

### User Features
- **Smart Desk Recommendations**: AI-powered desk suggestions based on:
  - Proximity to teammates (PostGIS spatial queries)
  - Feature preference matching (pgvector similarity)
  - Real-time availability
- **Booking Management**: Book, view, and cancel desk reservations
- **Team Collaboration**: Automatically find desks near your team members
- **Preference Learning**: System learns your desk preferences over time

### Admin Features
- **Office Management**: CRUD operations for offices, floors, zones, and desks
- **Desk Features**: Manage amenities (monitors, standing desks, quiet zones, etc.)
- **Utilization Reports**: View booking statistics and desk utilization
- **Flexible Configuration**: Set office hours, blackout dates, and desk availability
- **Floor Plan Management** (`/admin/floor-plans`): Upload a floor plan image per floor, then click to position each desk as a percentage coordinate. Users see an interactive floor plan with color-coded desk status (green = available, red = booked, blue = booked by your team) instead of a plain desk grid.
- **Booking Management** (`/admin/bookings`): View and cancel any user's booking, filterable by status.
- **User Management** (`/admin/users`): View all users and change roles between User/Admin (an admin cannot demote themselves).

### Multi-Day Booking
Users can select a start and end date (not just a single day) when booking a desk. The system creates one booking per day in the range, validates the range is at most 30 days and doesn't start in the past, and reports which specific days failed if there's a conflict.

### Technical Highlights
- **Advanced Spatial Queries**: PostGIS for geographic desk placement
- **Vector Similarity**: pgvector for preference matching
- **Booking Conflict Prevention**: Database-level constraints prevent double booking
- **Security Best Practices**: CSRF protection, rate limiting, input validation
- **Accessible UI**: WCAG-compliant, keyboard navigation, responsive design
- **Production Ready**: Deployed on free tiers (Vercel + Supabase/Neon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with PostGIS + pgvector extensions
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **UI Components**: Lucide icons, React Hot Toast
- **Deployment**: Vercel (frontend), Supabase/Neon (database)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS and pgvector extensions
  - **Option 1**: Use Supabase (free tier includes PostGIS)
  - **Option 2**: Use Neon (add PostGIS extension)
  - **Option 3**: Local PostgreSQL with extensions installed

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Office-Desk-Booking-System
npm install
```

### 2. Database Setup

#### Option A: Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → Database
4. Copy the connection string (use "Session pooler" for development)
5. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
   PostGIS is already enabled by default in Supabase.

#### Option B: Neon

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Enable extensions via SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Option C: Local PostgreSQL

```bash
# Install PostgreSQL with PostGIS (Ubuntu/Debian)
sudo apt-get install postgresql postgis

# Install pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Create database
createdb desk_booking

# Enable extensions
psql desk_booking
CREATE EXTENSION postgis;
CREATE EXTENSION vector;
```

### 3. Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (use your Supabase/Neon connection string)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Database Migration and Seeding

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 👥 Default Users (local/dev only)

After seeding, you can log in locally with:

**Admin Account**:
- Email: `admin@company.com`
- Password: `ChangeMe123!`

**User Account**:
- Email: `user@company.com`
- Password: `password123`

⚠️ These are seed values for local development only. Change `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` before seeding a production database, and never display demo credentials in the production UI.

## 📁 Project Structure

```
├── components/          # React components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── DeskCard.tsx    # Desk display component
│   └── BookingCard.tsx # Booking display component
├── lib/                # Utility libraries
│   ├── auth.ts         # NextAuth configuration
│   ├── prisma.ts       # Prisma client
│   ├── validations.ts  # Zod schemas
│   ├── api-response.ts # API response helpers
│   └── middleware/     # API middleware
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── bookings/  # Booking management
│   │   ├── desks/     # Desk queries
│   │   ├── recommendations/ # AI recommendations
│   │   └── admin/     # Admin CRUD operations
│   ├── auth/          # Auth pages (login, register)
│   ├── bookings.tsx   # User bookings page
│   ├── admin/         # Admin dashboard
│   └── index.tsx      # Home/search page
├── prisma/
│   ├── schema.prisma  # Database schema
│   ├── migrations/    # Migration files
│   └── seed.ts        # Seed data
├── styles/
│   └── globals.css    # Global styles
└── types/
    └── index.ts       # TypeScript types
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking

### Desks
- `GET /api/floors/:floorId/desks` - Get desks by floor
- `GET /api/desks/:id` - Get desk details

### Recommendations (AI-Powered)
- `POST /api/recommendations/desks` - Get personalized desk recommendations

### Admin (ADMIN role required)
- `GET/POST /api/admin/offices` - Manage offices
- `GET/POST /api/admin/floors` - Manage floors
- `GET/POST /api/admin/desks` - Manage desks
- `DELETE /api/admin/desks/:id` - Deactivate desk
- `PUT /api/admin/desks/positions` - Save desk floor-plan positions
- `POST /api/admin/floors/upload-map` - Upload a floor plan image (max 5MB)
- `GET /api/admin/floors/:floorId/desks` - Get desks for floor-plan editing
- `GET /api/admin/bookings` - List all bookings (any user)
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id` - Change a user's role

### Other
- `GET /api/teams` - Get teams list
- `GET /api/health` - Health check

## 🧠 Recommendation Algorithm

The system uses a hybrid approach combining:

1. **Spatial Distance** (40% weight)
   - PostGIS calculates physical distance to teammates' desks
   - Closer desks score higher

2. **Feature Similarity** (60% weight)
   - Cosine similarity between user preferences and desk features
   - Matches based on: monitor, standing desk, quiet zone, window, power outlet

3. **Scoring Formula**
   ```
   finalScore = (distanceScore * 0.4) + (similarityScore * 0.6)
   ```

If no teammates are booked, uses 100% feature similarity.

## 🔒 Security Features

- Password hashing with bcrypt
- HttpOnly secure cookies
- CSRF protection via NextAuth
- Input validation with Zod
- Rate limiting on auth endpoints
- SQL injection prevention via Prisma
- XSS protection headers
- Role-based authorization
- No sensitive data in client

## 🧪 Testing

Run type checking:
```bash
npm run type-check
```

Run linting:
```bash
npm run lint
```

## 📦 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy

### Database (Supabase/Neon)

Already deployed if using Supabase or Neon free tier.

For production database:
```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-db-url"

# Run migrations
npm run db:migrate:deploy

# Optionally seed
npm run db:seed
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

## 🎨 Customization

### Adding New Desk Features

1. Add feature to database:
   ```sql
   INSERT INTO desk_features (id, name, description, icon)
   VALUES ('feature-id', 'Feature Name', 'Description', 'icon-name');
   ```

2. Update user preferences schema in `prisma/schema.prisma`
3. Update recommendation algorithm in `pages/api/recommendations/desks.ts`
4. Regenerate Prisma client: `npm run db:generate`

### Customizing UI Theme

Edit colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom color palette
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### PostGIS/pgvector Not Found

Ensure extensions are enabled:
```sql
SELECT * FROM pg_extension WHERE extname IN ('postgis', 'vector');
```

If missing:
```sql
CREATE EXTENSION postgis;
CREATE EXTENSION vector;
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma
npm run db:generate
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Future Enhancements

- [ ] Calendar view for bookings
- [ ] Recurring bookings
- [ ] Email notifications
- [ ] Desk check-in/check-out
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Hot desk swapping
- [ ] QR code desk identification
- [ ] Integration with Microsoft/Google Calendar

## 📞 Support

For issues and questions, please open a GitHub issue.