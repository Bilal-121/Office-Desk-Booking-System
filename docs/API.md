# API Documentation

## Overview

The Office Desk Booking System provides a RESTful API for managing desk bookings, user authentication, and desk recommendations.

Base URL: `http://localhost:3000/api` (development)

## Authentication

All authenticated endpoints require a valid session cookie from NextAuth.js.

### Register

**POST** `/auth/register`

Create a new user account.

**Rate limit**: 10 requests per 15 minutes

**Request Body**:
```json
{
  "email": "user@company.com",
  "password": "Password123!",
  "name": "John Doe",
  "teamId": "optional-team-id"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2026-03-01T00:00:00.000Z"
  },
  "message": "User registered successfully"
}
```

### Login

**POST** `/auth/callback/credentials`

Login with email and password (handled by NextAuth).

Use the `signIn` function from `next-auth/react` on the client:

```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email: 'user@company.com',
  password: 'Password123!',
  redirect: false
});
```

### Get Current User

**GET** `/auth/me`

Get the currently authenticated user.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

## Bookings

### Get User Bookings

**GET** `/bookings`

Get all bookings for the authenticated user.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx456...",
      "startTime": "2026-03-05T09:00:00.000Z",
      "endTime": "2026-03-05T17:00:00.000Z",
      "status": "CONFIRMED",
      "notes": "Need quiet area",
      "desk": {
        "id": "clx789...",
        "deskNumber": "1-ENG-001",
        "floor": {
          "name": "First Floor",
          "floorNumber": 1
        },
        "zone": {
          "name": "Engineering Zone"
        }
      }
    }
  ]
}
```

### Create Booking

**POST** `/bookings`

Create a new desk booking.

**Authentication**: Required

**Request Body**:
```json
{
  "deskId": "clx789...",
  "startTime": "2026-03-05T09:00:00.000Z",
  "endTime": "2026-03-05T17:00:00.000Z",
  "notes": "Optional notes"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "clx456...",
    "userId": "clx123...",
    "deskId": "clx789...",
    "startTime": "2026-03-05T09:00:00.000Z",
    "endTime": "2026-03-05T17:00:00.000Z",
    "status": "CONFIRMED",
    "notes": "Optional notes",
    "desk": {
      "deskNumber": "1-ENG-001",
      "floor": { "name": "First Floor" }
    }
  },
  "message": "Booking created successfully"
}
```

**Error Response** (409):
```json
{
  "success": false,
  "error": "Desk is already booked for this time period"
}
```

### Cancel Booking

**DELETE** `/bookings/:id`

Cancel a booking.

**Authentication**: Required (must own booking or be admin)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx456...",
    "status": "CANCELLED"
  },
  "message": "Booking cancelled successfully"
}
```

## Desks

### Get Desks by Floor

**GET** `/floors/:floorId/desks`

Get all active desks on a specific floor.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx789...",
      "deskNumber": "1-ENG-001",
      "isActive": true,
      "floor": {
        "id": "clxabc...",
        "name": "First Floor",
        "floorNumber": 1
      },
      "zone": {
        "id": "clxdef...",
        "name": "Engineering Zone"
      },
      "features": [
        {
          "deskFeature": {
            "id": "feature1",
            "name": "Monitor",
            "description": "External monitor available",
            "icon": "monitor"
          }
        }
      ]
    }
  ]
}
```

### Get Desk Details

**GET** `/desks/:id`

Get detailed information about a specific desk.

**Query Parameters**:
- `startTime` (optional): ISO 8601 datetime
- `endTime` (optional): ISO 8601 datetime

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx789...",
    "deskNumber": "1-ENG-001",
    "floor": {
      "name": "First Floor"
    },
    "zone": {
      "name": "Engineering Zone"
    },
    "features": [...],
    "isAvailable": true
  }
}
```

## Recommendations

### Get Desk Recommendations

**POST** `/recommendations/desks`

Get AI-powered desk recommendations based on user preferences and teammate proximity.

**Authentication**: Required

**Request Body**:
```json
{
  "startTime": "2026-03-05T09:00:00.000Z",
  "endTime": "2026-03-05T17:00:00.000Z",
  "floorId": "optional-floor-id",
  "preferSameFloorAsTeam": true
}
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "deskId": "clx789...",
      "deskNumber": "1-ENG-002",
      "floorName": "First Floor",
      "zoneName": "Engineering Zone",
      "score": 0.87,
      "distance": 12.5,
      "similarity": 0.95,
      "features": ["Monitor", "Power Outlet", "Quiet Zone"],
      "isAvailable": true
    }
  ]
}
```

**Score Calculation**:
- `score`: Combined score (0-1)
- `distance`: Distance to nearest teammate in meters (null if no teammates)
- `similarity`: Feature preference match (0-1)

## Admin Endpoints

All admin endpoints require `ADMIN` role.

### Manage Offices

**GET** `/admin/offices`

Get all offices.

**POST** `/admin/offices`

Create a new office.

**Request Body**:
```json
{
  "name": "San Francisco HQ",
  "address": "123 Market Street",
  "city": "San Francisco",
  "country": "USA",
  "timezone": "America/Los_Angeles",
  "isActive": true
}
```

### Manage Floors

**GET** `/admin/floors`

Get all floors.

**POST** `/admin/floors`

Create a new floor.

**Request Body**:
```json
{
  "officeId": "clx123...",
  "name": "First Floor",
  "floorNumber": 1,
  "mapUrl": "https://example.com/floor-map.png",
  "isActive": true
}
```

### Manage Desks

**GET** `/admin/desks`

Get all desks. Optional query parameter: `?floorId=xxx`

**POST** `/admin/desks`

Create a new desk.

**Request Body**:
```json
{
  "floorId": "clx123...",
  "zoneId": "clx456...",
  "deskNumber": "1-ENG-010",
  "isActive": true,
  "location": {
    "longitude": -122.4,
    "latitude": 37.79
  },
  "features": ["feature-id-1", "feature-id-2"]
}
```

**DELETE** `/admin/desks/:id`

Deactivate a desk (soft delete).

## Utility Endpoints

### Health Check

**GET** `/health`

Check API health status.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-01T12:00:00.000Z",
    "uptime": 3600
  }
}
```

### Get Teams

**GET** `/teams`

Get list of all teams.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "name": "Engineering",
      "description": "Software Development Team"
    }
  ]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., double booking)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

Authentication endpoints are rate limited:
- `/auth/register`: 10 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes (configurable)

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709308800
```
