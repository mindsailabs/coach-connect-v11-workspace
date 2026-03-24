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

### 2026-03-24 — Fix: Artifact Access (Google Sign-In Issue)

**Problem:** Coaches were prompted to sign in to Google when viewing session recordings, transcripts, or Gemini notes. Files in info@mindsailabs.com's Drive were not shared with the coach.

**Root Cause:**
- `SessionRecordingPanel.jsx` embedded raw `drive.google.com/file/d/.../preview` URLs directly from `session.recording_file_id` — these require the viewer to have Drive access
- `backfillArtifacts` had a `shareFileWithCoach()` function but it relied on `session.coach_email` being populated, which wasn't always the case
- `getSessionArtifactContent` proxied transcript/notes text correctly but returned a raw Drive embed URL for recordings without ensuring access
- The recording panel never called the backend at all — it built the URL client-side

**Changes Made:**

1. **`base44/functions/backfillArtifacts/entry.ts`**
   - Kept `shareFileWithCoach()` — shares files with coach's email as reader (not public)
   - Added warning log when `coach_email` is missing so we can track sessions that need it

2. **`base44/functions/getSessionArtifactContent/entry.ts`**
   - Upgraded Drive scope from `drive.readonly` to `drive` (needed to create permissions)
   - Now shares the recording file with the coach's email before returning the embed URL
   - Acts as a fallback permission-setter even if backfill didn't run

3. **`src/components/app/SessionRecordingPanel.jsx`**
   - Now calls `getSessionArtifactContent` before rendering the embed
   - Backend ensures sharing is set before the iframe loads
   - Shows loading spinner while backend processes
   - Falls back to direct Drive URL if backend call fails

4. **NEW: `base44/functions/fixExistingArtifactPermissions/entry.ts`**
   - One-time function to fix all existing sessions
   - Iterates all sessions with artifact file IDs
   - Shares each file with the session's `coach_email`
   - Returns summary: sessions processed, files shared, errors
   - Run from Base44 dashboard after sync

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
