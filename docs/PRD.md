# AI Content Factory Pro - Product Requirements Document

## 1. Project Overview

**Project Name:** AI Content Factory Pro  
**Repository:** https://github.com/pokedongaming-lab/ai-content-factory-pro  
**Description:** Upgrade dari AI Content Builder yang sudah ada - menambahkan video rendering dan auto-publish ke social media  
**Target Users:** Content creators, affiliate marketers, social media managers

---

## 2. Problem Statement

Aplikasi AI Content Builder yang sudah ada hanya menghasilkan:
- Storyboard dengan script dan caption
- Start Frame + End Frame images per scene
- Export ZIP berisi images + script

**Keterbatasan:**
- Belum bisa convert frames ke video
- Belum ada integrasi langsung ke social media platforms
- User harus手动 upload ke TikTok/YouTube/Instagram

---

## 3. Product Goals

1. **Video Rendering** - Convert frames ke video dengan FFmpeg
2. **Auto-Publish** - Posting langsung ke TikTok, YouTube Shorts, Instagram Reels
3. **Analytics Dashboard** - Track publish status dan engagement

---

## 4. User Stories

### Video Rendering
| ID | User Story | Priority |
|----|------------|----------|
| US-V1 | Sebagai user, saya ingin convert Start/End frames menjadi video | P0 |
| US-V2 | Saya ingin add background music ke video | P1 |
| US-V3 | Saya ingin add voice over audio | P1 |
| US-V4 | Saya ingin pilih transisi antar scene | P1 |
| US-V5 | Saya ingin preview video sebelum download | P0 |

### Social Media Publishing
| ID | User Story | Priority |
|----|------------|----------|
| US-S1 | Saya ingin connect akun TikTok saya | P0 |
| US-S2 | Saya ingin publish video ke TikTok langsung dari app | P0 |
| US-S3 | Saya ingin connect akun YouTube dan publish Shorts | P0 |
| US-S4 | Saya ingin connect akun Instagram dan publish Reels | P1 |
| US-S5 | Saya ingin auto-generate caption untuk masing-masing platform | P1 |

### Dashboard & Analytics
| ID | User Story | Priority |
|----|------------|----------|
| US-D1 | Saya ingin lihat status publish (success/failed/pending) | P0 |
| US-D2 | Saya ingin lihat history konten yang sudah publish | P1 |
| US-D3 | Saya ingin lihat basic analytics (views, likes) | P2 |

---

## 5. Functional Requirements

### 5.1 Video Rendering Module

**FR-V1: Frame-to-Video Conversion**
- Input: Array of Start Frame + End Frame images
- Output: MP4 video (9:16 vertical format)
- Processing: FFmpeg with crossfade transitions

**FR-V2: Audio Management**
- Background music selection from preset library
- Voice over upload and sync
- Audio fade in/out

**FR-V3: Video Export**
- Download as MP4
- Quality options: 720p, 1080p
- File size optimization

### 5.2 Social Media Integration

**FR-S1: TikTok Integration**
- OAuth2 authentication
- Video upload API
- Caption + hashtag posting

**FR-S2: YouTube Shorts Integration**
- OAuth2 with YouTube Data API v3
- Video upload as Shorts
- Title + description + tags

**FR-S3: Instagram Reels Integration**
- Facebook Graph API
- Video upload as Reels
- Caption + hashtags

**FR-S4: Twitter/X Integration**
- OAuth2 with Twitter API v2
- Video tweet upload

### 5.3 Platform-Specific Requirements

| Platform | Aspect Ratio | Max Duration | Max File Size |
|----------|--------------|--------------|---------------|
| TikTok | 9:16 | 10 min | 287.6 MB |
| YouTube Shorts | 9:16 | 60 sec | 100 MB |
| Instagram Reels | 9:16 | 90 sec | 650 MB |
| Twitter/X | 16:9 or 9:16 | 140 sec | 512 MB |

---

## 6. Non-Functional Requirements

- **Performance:** Video rendering max 5 menit untuk 10 scenes
- **Security:** OAuth tokens encrypted di database
- **UX:** Loading states + progress indicators
- **Error Handling:** Retry mechanism untuk failed uploads

---

## 7. Technical Architecture

```
ai-content-factory-pro/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoRenderer.jsx
│   │   │   ├── SocialPublish.jsx
│   │   │   ├── PlatformConnect.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── hooks/
│   │   │   ├── useVideoRender.js
│   │   │   └── useSocialPublish.js
│   │   └── services/
│   │       └── api.js
├── server/                   # Node.js Backend
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API.md
└── README.md
```

---

## 8. Milestones

| Milestone | Deliverables | Target |
|-----------|--------------|--------|
| M1: Video Rendering | FFmpeg integration, frame-to-video, audio sync | Week 1-2 |
| M2: TikTok + YouTube | OAuth + publish to both platforms | Week 3-4 |
| M3: Instagram + Twitter | OAuth + publish to both platforms | Week 5 |
| M4: Dashboard | Analytics + history tracking | Week 6 |

---

## 9. Out of Scope (v1.0)

- AI Video Generation (Runway/Pika/Kling integration)
- Scheduled posting
- Multi-account management
- Team collaboration

---

## 10. Success Metrics

- Video rendering success rate > 95%
- Social media publish success rate > 90%
- User can complete full flow dalam < 15 menit

---

**Document Version:** 1.0  
**Created:** 2026-03-20  
**Last Updated:** 2026-03-20
