# Stella Scheduler Suite — Context README for AI Prompting.

## Project Overview

**Description:**  
A full-featured, modern web app for **appointment booking, staff scheduling, and time tracking** for spas, salons, and other service businesses.  
**Core Technologies:**  
React, TypeScript, Supabase (Postgres, RLS, Storage, Auth), Tailwind CSS, shadcn-ui, Vite.

**Project State:**  
Production-ready, actively developed.  
**Recent Focus:**  
- Major redesign of appointment and time tracking/calendar features.
- Enhanced image upload, admin "view as user" functions, real-time updates, and robust error handling.

## Directory Structure & Architecture

```
/src
│
├── /components
│   ├── BookingSystem.tsx              # Client booking wizard
│   ├── EnhancedBookingSystem.tsx      # Enhanced multi-step booking
│   ├── dashboard/                     # Dashboard summaries, appointment editing
│   ├── employee/                      # Employee schedule & time-tracking UI
│   ├── admin/                         # Admin dashboard features (staff/services/reservations)
│   ├── ui/                            # Shared UI components (cards, buttons, dialogs)
│   └── ...
├── /contexts
│   └── AuthContext.tsx                # Global authentication state/logic
├── /hooks
│   ├── use-mobile.tsx                 # Device detection for responsive behaviors
│   └── use-toast.ts                   # Toast notifications
├── /integrations/supabase
│   ├── client.ts                      # Supabase client instance
│   └── types.ts                       # Types for Supabase entities
├── /migrations                        # Database migrations (see below)
├── /lib
│   └── utils.ts
├── /pages                             # Main page-level components
├── /types
│   └── appointment.ts                 # Core TypeScript models
└── main.tsx                           # App entry point
```

## Key Modules & Their Roles

| File/Folder                              | Purpose / Pattern                                  |
|------------------------------------------|----------------------------------------------------|
| `/src/components/EnhancedBookingSystem.tsx` | Multi-step client booking wizard (progress, conflict checks) |
| `/src/components/admin/AdminServices.tsx`  | Admin management for services, image uploads, staff assignment |
| `/src/components/employee/EmployeeSchedule.tsx` | Staff set/modify weekly schedule (availability, drag-drop UI) |
| `/src/components/employee/TimeTracking.tsx` | Calendar-based time tracking, daily/weekly view, time blocks  |
| `/src/components/ui/`                    | All shared UI primitives (Button, Dialog, Card, Toast, Calendar, etc.) |
| `/src/contexts/AuthContext.tsx`          | Auth state and role logic                           |
| `/supabase/migrations/`                  | All DB migration scripts (schema, RLS, storage buckets, etc.) |

## Architecture Notes

- **State Management:**  
  - React Context for auth/profile (`AuthContext.tsx`).
  - Local state and custom hooks for forms and views.
- **API Layer:**  
  - Uses Supabase client (`@supabase/supabase-js`).
  - Real-time updates via subscriptions.
  - All domain objects (staff, services, reservations) are in DB, mapped to typed interfaces.
- **Styling:**  
  - Tailwind CSS, shadcn-ui primitives, modular and reusable styles.
- **Authentication & Roles:**  
  - Supabase Auth with row-level security (RLS) and explicit role checking (`admin`, `employee`, `client`).
- **Impersonation:**  
  - Admins can use "View as" feature to simulate any user (clients/employees).

## Database & Storage

- **Supabase Tables:**
  - `profiles` (users, roles)
  - `services` (offered services, pricing, image_url)
  - `employee_schedules` (weekly availability)
  - `employee_services` (many-to-many: who provides which services)
  - `reservations` (appointments)
  - `time_logs` (employee work sessions)
  - `blocked_times` (for breaks, meetings, unavailable slots)

- **Supabase Storage:**
  - `service-images` bucket (client-side image uploads, RLS policies enforced)

- **Migrations:**
  - Always run new migrations in `/supabase/migrations` (e.g., to create buckets, constraints, or RLS policies).
  - Example constraints:  
    - Employee schedule start_time < end_time  
    - Unique schedule per employee/day  
    - Foreign key links between domain tables

## App Patterns & Conventions

- **Imports:**  
  - Use absolute imports via aliasing (e.g., `@/components/Button`).
- **Async/Data:**  
  - All API/database operations have loading/error states and toast notifications.
  - Optimistic UI updates for bookings/reservations.
- **Error Handling:**  
  - Centralized toast and alert modalities.
  - Backend and frontend input validation.
- **Testing:**  
  - Designed for Jest/RTL and Playwright (unit/integration/E2E tests—expand as needed).
- **Accessibility:**  
  - Keyboard navigation, ARIA attributes, color contrast.
- **Responsive:**  
  - Mobile-first design (cards, dialogs, FABs, calendars adapt to touch and viewport).
- **Commits:**  
  - Use clear, conventional commits: feat, fix, chore, refactor, etc.

## Dependencies and Integrations

- **Third-party:**  
  date-fns, react-hook-form, lucide-react, TanStack React Query, shadcn-ui
- **External Services:**  
  Supabase (database, storage, auth)
- **Environment Variables:**  
  - Must set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.
- **Sensitive Data:**  
  - No secrets in repo; use .env or hosting provider key management.

## Pitfalls, Gotchas, & Edge Cases

- **Race Conditions:**  
  - Prevent double-booking (real-time conflict checks in booking wizard).
- **Time Zones:**  
  - All times/dates stored as UTC, always convert for local display.
- **Image Uploads:**  
  - Enforce image type and max size (10MB).  
  - Bucket must exist (`service-images`) and RLS policies must allow admin/employee uploads.
- **Availability & Time Validations:**  
  - Schedules and bookings must validate `start_time < end_time` (both client and DB).
- **State Sync:**  
  - Supabase subscriptions provide live UI sync—test "real-time" flows on bookings, time tracking.

## Recent & Planned Changes

| Date        | Change Area   | Summary                                   |
|-------------|--------------|-------------------------------------------|
| 2025-07     | Time Tracking | Full calendar-based redesign, blocked times, real-time sync improvements |
| 2025-07     | Admin UX      | "View as" impersonation for admin; fixes to modal scroll and accessibility |
| 2025-07     | Service CRUD  | Service image upload, validation, and role-based assignment improvements |
| 2025-07     | DB/RLS        | Constraint, policy, and index migrations for integrity and performance      |

## Notes for AI Code Changes

- **Acknowledge dependencies:**  
  - For every change, flag affected files, APIs, and DB structure.
- **Call out side effects:**  
  - E.g., "This adjustment in EmployeeSchedule may impact booking conflict logic."
- **Suggest or auto-generate tests:**  
  - Recommend corresponding tests or manual QA.
- **Use conventions:**  
  - Follow import/alias structure, update types/interfaces as needed.
- **Doc updates:**  
  - Update or reference affected sections of this README or supporting `.md` docs.

**Always cross-reference [supabase/migrations](./supabase/migrations/) when modifying DB logic or storage. Document any new setup steps or required migrations here and in commit messages.**

---

Citations:
[1] GitHub manueles91/stella-scheduler-suite LLM Context https://uithub.com/manueles91/stella-scheduler-suite?accept=text%2Fhtml&maxTokens=150000
