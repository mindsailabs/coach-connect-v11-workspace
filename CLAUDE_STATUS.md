# Claude Code – Change Log & Project Status

> **Last updated:** 2026-03-24
> **Project:** Coach Connect Guardian (Base44)
> **Repo:** https://github.com/mindsailabs/coach-connect-v11-workspace

---

## Current State

- App is a Base44-powered coaching/wellness CRM
- GitHub repo is linked to Base44 for auto-deploy on push
- Two test contacts are seeded on app load (frontend seed pattern)

---

## Change History

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
| Backend functions | `functions/` |

---

## Entities Available

Contact, Journey, Session, Task, Note, Approval, Invoice, Resource, AppSettings

---

## Pending / Next Steps

- Verify Tony Robinson appears in Base44 after sync
- Remove seed functions once test contacts are confirmed
- Begin building actual features

---

*This file is maintained by Claude Code. Copy its contents into Command Center for context.*
