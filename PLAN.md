# Production-Ready Full-Stack Meeting Scheduler: PLAN.md

## 1. Problem
Distributed global teams spanning divergent time zones (e.g., Bangalore `Asia/Kolkata` UTC+5:30, London `Europe/London` UTC+0/BST, San Francisco `America/Los_Angeles` UTC-8/UTC-7, Sydney `Australia/Sydney` UTC+11/AEST) struggle to find overlapping meeting times. Coordinators must juggle working hours, existing meetings, daylight saving changes (such as US DST onset on March 8, 2026), and timezone conversions. When no common slot exists, standard systems fail silently or return empty lists without explaining why or suggesting actionable compromises.

This project delivers a production-ready, deterministic Meeting Scheduler web application and REST API that calculates valid meeting slots, accounts for participant availability and existing meetings, converts slots to each participant's local timezone, and suggests intelligent alternatives when no universal slot is possible.

---

## 2. Scope
- **Participant Management**: CRUD operations for participants with name, email, location, IANA timezone identifier, and weekly availability rules (defaulting Monday–Friday local time ranges).
- **Existing Meeting / Unavailability Tracking**: Ability to log busy time blocks for participants.
- **Deterministic Scheduling Algorithm**: Canonical UTC half-open interval math `[start, end)` that intersects participant working hours, subtracts busy blocks, and slices available windows into requested meeting duration slots (e.g. 45 minutes) across a date window (e.g. 8–14 March 2026).
- **Timezone Awareness & DST Handling**: Real IANA timezone math using `date-fns-tz` to correctly handle daylight saving transitions and local calendar day boundaries.
- **Localized Slot Presentation**: Every suggested slot provides canonical UTC ISO timestamps and converted local time strings for each participant.
- **Intelligent Diagnostics & Alternative Suggestions**: When no universal meeting slot exists, the system provides diagnostic reasoning (e.g., disjoint working hours between specific time zones) and identifies best $N-1$ participant subsets and earliest compromise slots.
- **Layered Architecture & Production Hygiene**: Clean separation of Controller, Service, Repository, Model, Validator, and Centralized Error Handling in Node/Express/Mongoose; responsive, polished Tailwind CSS React frontend; robust automated unit, integration, and database-integrity tests.

---

## 3. Non-Goals
- Real-time OAuth 2.0 sync with external third-party calendars (Google Calendar, Outlook, Apple Calendar) — the assignment models participant availability and existing meetings natively.
- Video conferencing link generation (Zoom/Google Meet/Teams integration).
- Complex recurring meeting series recalculations beyond recurring weekday working hours.
- Authentication/RBAC system — the prompt focuses on coordinator scheduling logic and data integrity; security baseline covers rate limiting, helmet, input validation, and CORS.

---

## 4. Architecture

A layered, decoupled architectural model separating HTTP handling, validation, business orchestration, and persistence:

```text
Meeting-Scheduler/
├── client/
│   ├── src/
│   │   ├── api/             # Axios/fetch API client with error handling
│   │   ├── components/      # UI components (SchedulerForm, SlotResults, ParticipantList, etc.)
│   │   ├── hooks/           # Custom React hooks (useParticipants, useScheduler)
│   │   ├── utils/           # Timezone display formatters and local converters
│   │   ├── App.jsx          # Main application layout
│   │   ├── index.css        # Tailwind directives and custom tokens
│   │   └── main.jsx         # React DOM entry
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/          # Environment variable validation and DB connection
│   │   ├── constants/       # Error codes, HTTP status codes, default seed data
│   │   ├── controllers/     # HTTP route handlers (lean, no business logic)
│   │   ├── errors/          # Custom error hierarchy (AppError, ValidationError, ConflictError, etc.)
│   │   ├── middleware/      # Error handler, request logger, rate limiter, Zod validator
│   │   ├── models/          # Mongoose schemas with compound indexes and validators
│   │   ├── repositories/    # Clean DB query abstractions
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Domain logic, interval mathematics, scheduling engine
│   │   ├── utils/           # Interval math algorithms, timezone transformers, API envelope
│   │   ├── validators/      # Zod validation schemas for requests
│   │   ├── app.js           # Express app setup and middleware chain
│   │   └── server.js        # Server listener entry point
│   ├── package.json
│   └── .env.example
│
├── tests/
│   ├── setup.js             # MongoMemoryServer in-memory DB lifecycle
│   ├── unit/                # Interval math & scheduling algorithm unit tests
│   ├── integration/         # Express API endpoint integration tests
│   └── databaseIntegrity.test.js # Database constraint & unique index verification
│
├── PLAN.md
├── README.md
├── .env.example
└── package.json
```

### Layer Responsibilities:
- **Validator**: Enforces shape, types, constraints, non-empty fields, valid IANA timezones, and valid date/time ranges before reaching controllers.
- **Controller**: Extracts validated inputs, invokes appropriate service methods, and wraps outcomes in a uniform API envelope `{ success: true, data: ... }`.
- **Service**: Implements pure domain business rules, interval intersection/subtraction, timezone conversions, conflict detection, and diagnostic generation.
- **Repository**: Isolates Mongoose collection queries, projections, and updates.
- **Model**: Enforces database-level constraints (unique compound indexes, schema types, validation hooks).

---

## 5. Data Model

### Participant Collection (`participants`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  location: { type: String, required: true, trim: true },
  timezone: { type: String, required: true, validate: isValidIANATimezone },
  availability: {
    // Array of active weekday schedules
    // days: [1, 2, 3, 4, 5] (Monday=1 .. Sunday=7 or 0-6 ISO convention)
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ }, // e.g. "09:00"
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },   // e.g. "18:00"
    daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] } // Mon-Fri
  },
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes**:
- `{ email: 1 }` (Unique)
- `{ name: 1 }` (Unique compound with email or standalone index for fast lookup)

### Meeting / BusyBlock Collection (`meetings`)
```javascript
{
  participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true, index: true },
  title: { type: String, required: true, trim: true, default: 'Busy' },
  startTime: { type: Date, required: true }, // Stored as canonical UTC Date
  endTime: { type: Date, required: true },   // Stored as canonical UTC Date
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes & Invariants**:
- `{ participantId: 1, startTime: 1, endTime: 1 }`
- Invariant: `startTime < endTime` (enforced at Validator, Service, and Schema pre-save).

---

## 6. API Contract

All endpoints return a uniform envelope:
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | INVALID_TIMEZONE | INVALID_DATE_RANGE | BUSINESS_RULE_VIOLATION | INTERNAL_SERVER_ERROR",
    "message": "Human readable description",
    "details": [ ... ]
  }
}
```

### Endpoints:
1. `GET /api/health` — System status, uptime, and database connectivity.
2. `GET /api/participants` — List all participants with availability and upcoming meetings.
3. `POST /api/participants` — Create a new participant.
4. `GET /api/participants/:id` — Fetch participant details.
5. `PUT /api/participants/:id` — Update participant details or availability.
6. `DELETE /api/participants/:id` — Delete participant and their associated meetings.
7. `POST /api/participants/:id/meetings` — Log an existing meeting / busy slot for a participant.
8. `DELETE /api/meetings/:id` — Remove an existing meeting.
9. `POST /api/scheduling/slots` — Calculate available meeting slots.
   - **Request Body**:
     ```json
     {
       "participantIds": ["64a...", "64b..."],
       "startDate": "2026-03-08",
       "endDate": "2026-03-14",
       "durationMinutes": 45,
       "granularityMinutes": 15
     }
     ```
   - **Response Body**:
     ```json
     {
       "success": true,
       "data": {
         "durationMinutes": 45,
         "searchWindow": { "startDate": "2026-03-08", "endDate": "2026-03-14" },
         "totalSlotsFound": 3,
         "hasUniversalSlots": true,
         "slots": [
           {
             "slotId": "2026-03-09T13:00:00.000Z_45m",
             "startUtc": "2026-03-09T13:00:00.000Z",
             "endUtc": "2026-03-09T13:45:00.000Z",
             "durationMinutes": 45,
             "participantTimes": [
               {
                 "participantId": "...",
                 "name": "Maya",
                 "location": "Bangalore",
                 "timezone": "Asia/Kolkata",
                 "localDate": "2026-03-09",
                 "localStartTime": "18:30",
                 "localEndTime": "19:15",
                 "formattedLocalRange": "Mon, Mar 9, 2026, 6:30 PM – 7:15 PM IST"
               }
             ]
           }
         ],
         "alternatives": {
           "explanation": "...",
           "subsetSuggestions": [ ... ],
           "closestOutWindowSlots": [ ... ]
         }
       }
     }
     ```
10. `POST /api/seed` — Reset or initialize the system with the 4 default participants (Maya, Tom, Sara, Jack).

---

## 7. Business Rules & Enforcement Strategy

| Business Rule | UI Enforcement | API / Validator Enforcement | Database Layer | Rationale |
|---|---|---|---|---|
| **Participant Uniqueness** | Form shows error if email duplicated | Zod validates email format; Service verifies uniqueness | Compound Unique Index on `{ email: 1 }` | Race condition protection against concurrent submissions |
| **Valid IANA Timezone** | Searchable dropdown with validated IANA list | Zod checks against `Intl.supportedValuesOf('timeZone')` | Mongoose enum/custom validator | Prevents corrupted timezone offsets and crash during conversions |
| **Availability Range Validity** | Time pickers ensure start < end | Validator checks `startTime < endTime` regex | Schema validator | Prevents negative or zero length working windows |
| **Meeting Window Validity** | DateTime picker ensures end > start | Validator asserts `new Date(end) > new Date(start)` | Pre-save hook / constraint | Prevents inverted time intervals |
| **Slot Duration Positive & Bounded** | Input constraint `min=15, max=480, step=15` | Zod `min(15).max(480)` | Service invariant | Ensures algorithm termination and realistic meetings |
| **No Overlapping Busy Slots in Suggestions** | Visual calendar preview | Service subtracts `[meetingStart, meetingEnd)` from available intervals | Interval math correctness | Fundamental guarantee that suggestions are conflict-free |
| **Universal Slot Guarantee** | Visual checkmark / badge | Service asserts intersection is non-empty for all selected participants | Algorithm logic | Guarantees that suggested slots are genuinely mutually free |

---

## 8. Important Engineering Decisions

1. **Canonical Half-Open Intervals `[start, end)` in UTC**:
   Interval mathematics with inclusive start and exclusive end avoids double-booking boundary errors (e.g. a meeting ending at 13:00 allows another meeting starting at 13:00 without conflict: `[12:00, 13:00)` and `[13:00, 14:00)` do not intersect).
2. **Explicit Timezone Projection with `date-fns-tz`**:
   Rather than naive offset arithmetic, the scheduling algorithm generates local calendar day intervals in the participant's IANA timezone and converts each to UTC using exact astronomical/historical DST rules. For instance, on March 8, 2026, `America/Los_Angeles` transitions from UTC-8 to UTC-7.
3. **Layered Architecture with Isolated Service Logic**:
   Business rules and interval algorithms are kept in pure JavaScript service and utility files, allowing 100% test coverage without coupling to HTTP controllers or Express internals.
4. **Structured Diagnostic Alternatives for Zero-Match Searches**:
   When 4 global locations have disjoint working hours (e.g. Bangalore, London, SF, Sydney spanning 19 hours difference), the system does not fail silently; it computes best $N-1$ participant subsets and pinpoints exact conflicting intervals so the coordinator can make an informed compromise.
5. **In-Memory Database Testing with `mongodb-memory-server`**:
   Automated tests run against a real ephemeral MongoDB instance, testing compound indexes, duplicate-key errors (`code 11000`), and transactions without external server prerequisites.

---

## 9. Testing Strategy

### Unit Tests (`tests/unit/`):
- `intervalMath.test.js`: Half-open interval intersections, subtractions, merges, edge cases (empty intervals, adjacent boundaries, subset containment).
- `timezoneHelper.test.js`: IANA timezone validations, DST transitions (March 8, 2026 San Francisco), multi-day local projections.
- `schedulingAlgorithm.test.js`: Multi-participant availability calculation, existing meeting exclusions, slot slicing.

### Integration Tests (`tests/integration/`):
- `participants.api.test.js`: CRUD endpoints, duplicate participant 409 conflict, invalid IANA timezone 400 rejection.
- `meetings.api.test.js`: Creating busy slots, invalid date range 400 rejection, deletion.
- `scheduling.api.test.js`: 45-minute meeting search between 8–14 March 2026, verifying exact slot outputs, timezone conversions, and fallback diagnostics.
- `databaseIntegrity.test.js`: Direct Mongoose save operations verifying unique indexes reject duplicate emails and enforce valid schema constraints.

---

## 10. Known Limitations
- Does not integrate with live Google Workspace / Microsoft 365 OAuth calendar webhooks (mocked/native busy block management as per assignment requirements).
- Assumes standard weekly recurring working hours (unless overridden per participant).
- Slot generation uses configurable discrete steps (default 15 minutes) to ensure optimal response performance.
