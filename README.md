# AI Content Factory Pro

Video rendering and social media publishing upgrade for AI Content Builder.

## Features

- 🎬 **Video Rendering** - Convert Start/End frames to MP4 using FFmpeg
- 📱 **Multi-Platform Publishing** - Publish to TikTok, YouTube Shorts, Instagram Reels, Twitter/X
- 📊 **Dashboard** - Track publish status and analytics

## Tech Stack

- **Frontend:** React + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Neon/Supabase)
- **Video Processing:** FFmpeg

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/pokedongaming-lab/ai-content-factory-pro.git
cd ai-content-factory-pro
```

2. **Setup Client**
```bash
cd client
npm install
npm run dev
```

3. **Setup Server**
```bash
cd server
cp .env.example .env
# Edit .env with your API keys
npm install
npm run dev
```

4. **Open Browser**
- Client: http://localhost:5173
- API: http://localhost:3001/api/health

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/video/render | Convert frames to video |
| GET | /api/video/status/:jobId | Check rendering status |
| POST | /api/publish/:platform | Publish to platform |
| GET | /api/publish/history | Get publish history |
| GET | /api/auth/:platform/url | Get OAuth URL |
| GET | /api/user/profile | Get user profile |

## Project Structure

```
ai-content-factory-pro/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js Backend
│   ├── src/
│   │   ├── index.js
│   │   └── routes/
│   │       ├── video.js
│   │       ├── publish.js
│   │       ├── auth.js
│   │       └── user.js
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
└── README.md
```

## Contributing

See [Issues](https://github.com/pokedongaming-lab/ai-content-factory-pro/issues) for tasks.

## License

MIT
