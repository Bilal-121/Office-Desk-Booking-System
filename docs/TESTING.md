# Testing Guide

This document outlines testing strategies for the Office Desk Booking System.

## Testing Philosophy

- **Database Integrity**: Prevent double bookings via DB constraints
- **API Validation**: All inputs validated before processing
- **Authorization**: Role-based access control enforced
- **Edge Cases**: Handle overlapping bookings, timezone issues, etc.

## Manual Testing Checklist

### Authentication Tests

- [ ] **Register new user**
  - Valid credentials → Success
  - Duplicate email → Error
  - Weak password → Error
  - Missing fields → Error

- [ ] **Login**
  - Valid credentials → Success
  - Invalid email → Error
  - Wrong password → Error
  - Rate limiting after 10 attempts

- [ ] **Session management**
  - Logged in state persists on refresh
  - Can access protected routes
  - Cannot access admin routes as user
  - Logout clears session

### Booking Tests

- [ ] **Create booking**
  - Valid time range → Success
  - End time before start time → Error
  - Overlapping booking → Error (409)
  - Booking on inactive desk → Error
  - Past date → Success (allowed)

- [ ] **View bookings**
  - See only own bookings
  - Bookings sorted by date
  - Show desk and location info

- [ ] **Cancel booking**
  - Own booking → Success
  - Other's booking (as user) → Error (403)
  - Other's booking (as admin) → Success
  - Already cancelled → Error

### Recommendation Tests

- [ ] **Get recommendations**
  - Returns available desks only
  - Scores calculated correctly
  - Distance shown when teammates present
  - Similarity matches preferences
  - Sorted by score (highest first)

- [ ] **Filters**
  - Floor filter works
  - Team floor preference works
  - Time range respected

### Admin Tests

- [ ] **Access control**
  - Regular user cannot access admin routes
  - Admin can access all routes

- [ ] **CRUD operations**
  - Create office → Success
  - Create floor → Success
  - Create desk with location → Success
  - Deactivate desk → Success

## API Testing with cURL

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

### Create Booking

```bash
# First login to get session cookie, then:
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deskId": "desk-id-here",
    "startTime": "2026-03-05T09:00:00.000Z",
    "endTime": "2026-03-05T17:00:00.000Z"
  }'
```

### Get Recommendations

```bash
curl -X POST http://localhost:3000/api/recommendations/desks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "startTime": "2026-03-05T09:00:00.000Z",
    "endTime": "2026-03-05T17:00:00.000Z",
    "preferSameFloorAsTeam": true
  }'
```

## Database Testing

### Test Booking Overlap Prevention

```sql
-- This should fail (overlap with existing booking)
BEGIN;

-- First booking
INSERT INTO bookings (id, "userId", "deskId", "startTime", "endTime", status)
VALUES ('booking1', 'user1', 'desk1', '2026-03-05 09:00', '2026-03-05 17:00', 'CONFIRMED');

-- Overlapping booking (should fail)
INSERT INTO bookings (id, "userId", "deskId", "startTime", "endTime", status)
VALUES ('booking2', 'user2', 'desk1', '2026-03-05 14:00', '2026-03-05 18:00', 'CONFIRMED');

ROLLBACK;
```

Expected: Second insert fails with "Desk is already booked for this time period"

### Test Spatial Queries

```sql
-- Get desks within 50 meters of a point
SELECT 
  id, 
  "deskNumber",
  ST_Distance(
    location::geography,
    ST_SetSRID(ST_MakePoint(-122.4, 37.79), 4326)::geography
  ) as distance_meters
FROM desks
WHERE location IS NOT NULL
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(-122.4, 37.79), 4326)::geography,
    50
  )
ORDER BY distance_meters;
```

## Performance Testing

### Database Query Performance

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE "deskId" = 'desk-id'
  AND status = 'CONFIRMED'
  AND "startTime" < '2026-03-05 17:00'
  AND "endTime" > '2026-03-05 09:00';
```

Expected: Should use indexes on deskId and startTime/endTime

### API Response Times

```bash
# Measure API response time
time curl -X POST http://localhost:3000/api/recommendations/desks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"startTime": "2026-03-05T09:00:00.000Z", "endTime": "2026-03-05T17:00:00.000Z"}'
```

Expected: < 500ms for recommendation query

## Automated Testing (Future)

### Unit Test Example (Jest)

```typescript
// __tests__/lib/validations.test.ts
import { bookingSchema } from '@/lib/validations';

describe('Booking Validation', () => {
  it('should validate correct booking', () => {
    const valid = {
      deskId: 'desk123',
      startTime: '2026-03-05T09:00:00.000Z',
      endTime: '2026-03-05T17:00:00.000Z',
    };
    
    const result = bookingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject end time before start time', () => {
    const invalid = {
      deskId: 'desk123',
      startTime: '2026-03-05T17:00:00.000Z',
      endTime: '2026-03-05T09:00:00.000Z',
    };
    
    const result = bookingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

### API Integration Test Example

```typescript
// __tests__/api/bookings.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/bookings/index';

describe('/api/bookings', () => {
  it('should create booking', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        deskId: 'desk123',
        startTime: '2026-03-05T09:00:00.000Z',
        endTime: '2026-03-05T17:00:00.000Z',
      },
    });

    // Mock authenticated user
    (req as any).user = { id: 'user123', role: 'USER' };

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });
});
```

## Security Testing

### SQL Injection Test

Try to inject SQL in various inputs:

```bash
# Should be safely escaped by Prisma
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deskId": "desk123; DROP TABLE bookings;--",
    "startTime": "2026-03-05T09:00:00.000Z",
    "endTime": "2026-03-05T17:00:00.000Z"
  }'
```

Expected: Validation error or no injection occurs

### XSS Test

Try to inject JavaScript:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deskId": "desk123",
    "startTime": "2026-03-05T09:00:00.000Z",
    "endTime": "2026-03-05T17:00:00.000Z",
    "notes": "<script>alert(\"XSS\")</script>"
  }'
```

Expected: HTML escaped in output, no script execution

### Authentication Bypass Test

```bash
# Try to access protected route without auth
curl http://localhost:3000/api/bookings

# Expected: 401 Unauthorized
```

## Load Testing

### Using Apache Bench

```bash
# Test 100 requests with 10 concurrent
ab -n 100 -c 10 -H "Cookie: session-cookie-here" \
  http://localhost:3000/api/bookings
```

### Expected Results

- **Success rate**: 100%
- **Average response time**: < 200ms
- **No database locks**: All queries complete

## Test Coverage Goals

- [ ] All API endpoints have at least one test
- [ ] All validation schemas tested
- [ ] Database constraints verified
- [ ] Authentication/authorization tested
- [ ] Error handling tested
- [ ] Edge cases covered

## Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
```

## Bug Reporting

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Error messages** (console & network tab)
5. **Environment** (browser, OS, etc.)
6. **Screenshots** if applicable

## Test Data

Use the seeded data for testing:

**Users**:
- Admin: `admin@company.com` / `Admin123!`
- User: `john.doe@company.com` / `Password123!`

**Desks**: 24 desks across 3 zones on 2 floors

**Teams**: Engineering, Design, Sales

---

Happy testing! 🧪
