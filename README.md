# SoundStage 🎛️

A Kanban-style music production workflow app for organizing audio tracks across production stages — from initial sketch to final master.

Built as a portfolio project to explore real-time drag-and-drop, global audio state management, and file storage in a modern Next.js stack.

**Live demo:** https://sound-stage-f2xk.vercel.app

---

## Features

- **Kanban board** – Drag and drop tracks across stages (Skiss -> Demo -> Mix -> Master) with smooth cross-column movement
- **Global audio player** – Persistent player with waveform visualization, progress seeking, and volume control
- **Waveform rendering** – Real-time waveform display using Wavesurfer.js
- **Keyboard navigation** – Arrow keys to browse tracks, Space to play/pause, media keys supported via MediaSession API
- **Project switcher** – Create, rename, and delete multiple album/EP projects
- **Audio upload** – Upload and replace MP3 files per track via Supabase Storage
- **Track metadata** – BPM, key signature, and title per track

---

## Tech Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Framework      | Next.js 15 (App Router)      |
| Language       | TypeScript                   |
| Styling        | Tailwind CSS                 |
| Drag & Drop    | dnd-kit                      |
| Audio Playback | Web Audio API + AudioContext |
| Waveform       | Wavesurfer.js                |
| Database       | PostgreSQL via Supabase      |
| ORM            | Prisma                       |
| File Storage   | Supabase Storage             |
| Deployment     | Vercel                       |

---

## Technical Challenges

### Global Audio State

Managing audio playback across a complex component tree required a custom React Context (`AudioContext`) that owns a single `HTMLAudioElement` for the entire session. This prevents audio interruptions during re-renders and enables features like playlist continuity when tracks are reordered.

### Drag & Drop with Keyboard Conflicts

dnd-kit's default keyboard sensor uses Space and Enter to activate drag mode — conflicting with the app's own Space (play/pause) and arrow key (track navigation) shortcuts. The solution was to destructure dnd-kit's `onKeyDown` from `listeners`, intercept Space before it reached dnd-kit, and route all other keys back to dnd-kit's handler.

### Waveform Sync Without Dual Audio Engines

Wavesurfer.js normally controls its own audio engine. To avoid conflicts with the app's existing `AudioContext`, Wavesurfer is used purely as a renderer — it loads the audio file for analysis but all playback is handled externally. Progress is synced from `AudioContext` to Wavesurfer via `seekTo()`, with a guard to prevent seek feedback loops.

### Cross-Column Drag Preview

dnd-kit's `onDragOver` is used for live optimistic UI updates during drag, while `onDragEnd` handles final persistence to the database. This separation eliminates the flicker caused by waiting for server responses before updating the UI.

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase and database credentials

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

---

## Environment Variables

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
