# Claude Code – Change Log & Project Status

> **Last updated:** 2026-03-24
> **Project:** Coach Connect Guardian (Base44)
> **Repo:** https://github.com/mindsailabs/coach-connect-v11-workspace

---

## Current State

- App is a Base44-powered coaching/wellness CRM
- GitHub repo is linked to Base44 for auto-deploy on push
- Two test contacts are seeded on app load (frontend seed pattern)
- Session recording player now streams via backend proxy (no Google sign-in needed)

---

## Change History

### 2026-03-24 — Recording Player Fix (Stream + Play Overlay)

5. **Fixed recording player: direct streaming instead of blob download**
   - `src/components/app/SessionRecordingPanel.jsx` rewritten
   - Previously downloaded entire video as blob before playing (slow)
   - Now uses `?access_token=TOKEN` query param for direct streaming — video starts immediately
   - `preload="metadata"` so browser fetches just enough for duration/first frame

6. **Added custom play overlay**
   - Large branded play button (circle, #2f949d primary color)
   - Shows over video when paused, fades out on play
   - Uses `AnimatePresence` for smooth fade transitions
   - Shows both before metadata loads and when paused
   - Matches the app's neumorphic design system

### 2026-03-24 — Fix Session Recording Access (Backend Proxy)

4. **Created `streamRecording` backend function** (`base44/functions/streamRecording/entry.ts`)
   - Uses service account JWT (same auth pattern as `getSessionArtifactContent`)
   - Returns short-lived access token (~1 hour) + Google Drive download URL
   - Frontend uses token to stream video directly from Google Drive API
   - Coach never needs to authenticate with Google
   - Files stay private (no "anyone with the link" permissions)
   - Root cause: Chrome blocks third-party cookies in iframes, so Drive embed shows "Sign in"

### 2026-03-24 — Initial Setup & Test Contacts

1. **Repo linked to GitHub**
   - Remote: `https://github.com/mindsailabs/coach-connect-v11-workspace.git`
   - Branch: `main`
   - Base44 syncs from this repo

2. **Created test contact: James Kennedy** (`src/utils/seedDemoData.js`)
   - Client, Active, Male, DOB 1988-06-15
   - Focus: Stress, Sleep, Weight loss
   - Tags: VIP, Morning
   - Referred by Michael Torres
   - Seeded via `Contact.create()` on app load (skips if already exists)

3. **Created test contact: Tony Robinson** (`src/utils/seedDemoData.js`)
   - Client, Active, Male, DOB 1975-03-22
   - Focus: Weight, Stress, Sleep
   - Tags: Evening, Tech
   - Referred by James Kennedy
   - Same frontend seed pattern as James Kennedy

---

## Project Structure (Key Files)

| Area | Path |
|------|------|
| Main app entry | `src/App.jsx` |
| Entities (API) | `src/api/entities.js` |
| Seed data | `src/utils/seedDemoData.js` |
| Pages | `src/pages/` (App, Settings, etc.) |
| Components | `src/components/app/` |
| UI primitives | `src/components/ui/` |
| Backend functions | `base44/functions/` |
| Recording proxy | `base44/functions/streamRecording/entry.ts` |
| Artifact content | `base44/functions/getSessionArtifactContent/entry.ts` |

---

## Entities Available

Contact, Journey, Session, Task, Note, Approval, Invoice, Resource, AppSettings

---

## Key Session Fields (Artifacts)

- `recording_file_id` — Google Drive file ID for the recording
- `recording_url` — Direct URL (e.g., Zoom download link)
- `transcript_doc_id` — Google Drive doc ID for transcript
- `gemini_notes_doc_id` — Google Drive doc ID for Gemini AI notes
- `edited_transcript` — Coach-edited transcript text

---

## Pending / Next Steps

- Test that recording streams correctly after Base44 sync
- Remove seed functions once test contacts are confirmed
- Begin building actual features

---

*This file is maintained by Claude Code. Copy its contents into Command Center for context.*
