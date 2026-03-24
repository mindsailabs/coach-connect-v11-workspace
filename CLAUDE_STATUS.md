# Claude Code – Change Log & Project Status

> **Last updated:** 2026-03-24
> **Project:** Coach Connect Guardian (Base44)
> **Repo:** https://github.com/mindsailabs/coach-connect-v11-workspace

---

## Current State

- App is a Base44-powered coaching/wellness CRM
- GitHub repo is linked to Base44 for auto-deploy on push
- Two test contacts are seeded on app load (frontend seed pattern)
- Artifact access fix deployed: coaches are shared as readers on Drive files

---

## Change History

### 2026-03-24 — Fix: Artifact Access (Video Streaming Proxy)

**Problem:** Coaches were prompted to sign in to Google when viewing session recordings. Files in info@mindsailabs.com's Drive required Google authentication, and even email-based sharing only works if the coach is also logged into Google in their browser.

**Root Cause:**
- `SessionRecordingPanel.jsx` embedded raw `drive.google.com/file/d/.../preview` iframe URLs
- Google Drive iframes ALWAYS require the viewer to have an active Google session — regardless of file permissions
- Transcripts/notes were already proxied server-side (text returned as JSON) — they worked fine
- The recording was the only artifact still using a raw Drive embed

**Solution: Backend Video Streaming Proxy**
- Created `streamRecording` function that uses the service account to download the video binary from Drive and streams it directly to the frontend
- The coach's browser never contacts Google — all video data flows through our backend
- Frontend uses a blob URL with a native `<video>` element instead of a Drive iframe
- Privacy preserved: files stay private in Drive, no public links, no Google sign-in needed

**Changes Made:**

1. **NEW: `base44/functions/streamRecording/entry.ts`**
   - Receives `sessionId`, verifies access, fetches video from Drive via service account
   - Returns raw video binary stream (not JSON) with correct Content-Type headers
   - Supports any video mime type (mp4, webm, etc.)

2. **`base44/functions/getSessionArtifactContent/entry.ts`**
   - Removed Drive embed URL and permission sharing for recordings
   - Now returns `recordingSessionId` flag instead of `recordingEmbedUrl`
   - Reverted scope back to `drive.readonly` (no longer needs write permissions)
   - Transcripts/notes still proxied as text (unchanged)

3. **`src/components/app/SessionRecordingPanel.jsx`**
   - Uses raw `fetch()` to call `streamRecording` (not SDK invoke, since response is binary)
   - Converts response blob to blob URL for native `<video>` playback
   - Shows loading spinner during download, error state on failure
   - Cleans up blob URLs on unmount to prevent memory leaks
   - Falls back to direct URL if `session.recording_url` is set (non-Drive recordings)

4. **`base44/functions/backfillArtifacts/entry.ts`** (from earlier commit)
   - Still shares files with coach_email as reader (useful for direct Drive access)
   - Added warning log when coach_email is missing

5. **`base44/functions/fixExistingArtifactPermissions/entry.ts`** (from earlier commit)
   - One-time function to share existing session artifacts with coach_email
   - Run from Base44 dashboard

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

3. **Created test contact: Tony Robinson** (`src/utils/seedDemoData.js`)
   - Client, Active, Male, DOB 1975-03-22
   - Focus: Weight, Stress, Sleep
   - Tags: Evening, Tech
   - Referred by James Kennedy

4. **App.jsx wired up** — Both seeds run once on app load after auth completes

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

---

## Entities Available

Contact, Journey, Session, Task, Note, Approval, Invoice, Resource, AppSettings

---

## Session Artifact Fields

- `recording_file_id` — Google Drive file ID for the MP4 recording
- `recording_url` — Direct URL (for non-Drive recordings)
- `transcript_doc_id` — Google Drive file ID for the transcript doc
- `gemini_notes_doc_id` — Google Drive file ID for Gemini Notes
- `edited_transcript` — User-edited transcript text (stored in entity)
- `coach_email` — Email used to share Drive files with the coach

---

## Pending / Next Steps

- Run `fixExistingArtifactPermissions` from Base44 dashboard to fix existing sessions
- Verify recording embed works without Google sign-in prompt
- Ensure all sessions have `coach_email` populated
- Remove seed functions once test contacts are confirmed

---

*This file is maintained by Claude Code. Copy its contents into Command Center for context.*
