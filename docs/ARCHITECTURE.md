# AI Content Factory Pro - Architecture

## Overview

This document describes the technical architecture for AI Content Factory Pro, a system that extends the existing AI Content Builder with video rendering and social media publishing capabilities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ VideoRenderer│  │SocialPublish │  │    Dashboard         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js Backend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  /api/video  │  │ /api/publish │  │   /api/auth          │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Platform API Clients                         │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐   │  │
│  │  │ TikTok  │ │ YouTube  │ │Instagram│ │  Twitter    │   │  │
│  │  └─────────┘ └──────────┘ └─────────┘ └─────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  FFmpeg      │  │ TikTok API  │  │   YouTube API       │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Instagram    │  │  Twitter    │  │   PostgreSQL        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Client (React)

| Component | Responsibility |
|-----------|----------------|
| VideoRenderer | UI for frame-to-video conversion, preview, download |
| SocialPublish | UI for platform selection, caption editing, publish |
| PlatformConnect | OAuth connection UI for each platform |
| Dashboard | Analytics display, publish history |

### Backend (Node.js)

| Module | Responsibility |
|--------|----------------|
| video service | FFmpeg processing, video generation |
| publish service | Platform API orchestration |
| auth service | OAuth token management |
| user service | User data, preferences |

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  createdAt: Date;
  platforms: PlatformConnection[];
}
```

### PlatformConnection
```typescript
interface PlatformConnection {
  platform: 'tiktok' | 'youtube' | 'instagram' | 'twitter';
  accessToken: string;        // encrypted
  refreshToken: string;       // encrypted
  expiresAt: Date;
  accountId: string;
  accountName: string;
}
```

### ContentProject
```typescript
interface ContentProject {
  id: string;
  userId: string;
  name: string;
  frames: FrameData[];
  videoUrl?: string;
  publishHistory: PublishRecord[];
  createdAt: Date;
}
```

### PublishRecord
```typescript
interface PublishRecord {
  id: string;
  platform: Platform;
  status: 'pending' | 'success' | 'failed';
  publishedUrl?: string;
  publishedAt?: Date;
  error?: string;
  analytics?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
}
```

## API Endpoints

### Video
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/video/render | Convert frames to video |
| GET | /api/video/status/:jobId | Check rendering status |
| GET | /api/video/download/:jobId | Download rendered video |

### Publish
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/:platform/url | Get OAuth URL |
| GET | /api/auth/:platform/callback | OAuth callback |
| POST | /api/publish/:platform | Publish video to platform |
| GET | /api/publish/history | Get publish history |
| GET | /api/publish/status/:id | Check publish status |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get user profile |
| GET | /api/user/connections | Get platform connections |
| DELETE | /api/user/connection/:platform | Disconnect platform |

## Security

### OAuth Token Storage
- Tokens encrypted using AES-256
- Refresh tokens stored for automatic renewal
- Token refresh happens before expiration

### API Security
- Rate limiting per user
- Request validation
- HTTPS only

## Video Processing Flow

```
1. User clicks "Render Video"
2. Client sends frames + audio to /api/video/render
3. Server creates FFmpeg command:
   - Input: Start/End frame images
   - Filter: crossfade transition
   - Audio: mix background music + voice over
4. Server returns jobId
5. Client polls /api/video/status/:jobId
6. When complete, client downloads from /api/video/download/:jobId
```

## Publish Flow

```
1. User clicks "Publish"
2. Client sends video + platform + caption to /api/publish/:platform
3. Server validates OAuth token (refresh if needed)
4. Server uploads video to platform API
5. Server updates publish record
6. Client shows success/failure status
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| FFmpeg failure | Retry 3x, then return error with message |
| OAuth token expired | Auto-refresh using refresh token |
| Publish failed | Store error, allow retry |
| Rate limited | Queue and retry with backoff |

## Deployment

### Development
- Client: Vite dev server (localhost:5173)
- Backend: Express server (localhost:3001)

### Production
- Client: Vite build → static hosting (Vercel/Netlify)
- Backend: Render/Railway/DigitalOcean
- Database: Neon/Supabase PostgreSQL

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-20
