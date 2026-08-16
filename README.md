# Distributed Meeting Scheduler

A production-ready, full-stack distributed meeting scheduling system and deterministic interval optimization engine built on the MERN stack (React, Node.js, Express, MongoDB, Tailwind CSS).

Designed for distributed global teams (e.g., Bangalore, London, San Francisco, Sydney) to calculate overlapping working hours, account for individual participant availability and busy blocks, project canonical UTC timestamps to localized participant timezones with Daylight Saving Time (DST) precision, and provide structured diagnostics and $(N-1)$ subset alternatives when no universal slot exists.

---

## 1. Project Overview

Finding a common meeting time across multiple continents is a complex constraint satisfaction problem compounded by:
- Non-overlapping regional business hours (e.g., Bangalore `Asia/Kolkata` vs. San Francisco `America/Los_Angeles` spanning up to 13.5 hours difference).
- Dynamic Daylight Saving Time transitions (e.g., US Spring Forward on March 8, 2026).
- Existing calendar commitments and busy blocks.
- Lack of actionable diagnostics when standard algorithms fail silently.

This system provides a mathematical interval engine using half-open `[start, end)` intervals in canonical UTC, multi-layer invariant enforcement (UI, API, and Database), and an intuitive, modern coordinator interface.

---

## 2. Features

- **Participant Management**: Full CRUD operations for team members with name, email, location, IANA timezone identifier, and weekly recurring availability (e.g. Mon–Fri 09:00–18:00 local time).
- **Busy Blocks & Existing Meetings**: Ability to record and manage pre-existing calendar commitments per participant.
- **Deterministic Scheduling Algorithm**:
  - Converts local working hours per local calendar day to canonical UTC timestamps using `date-fns-tz`.
  - Subtracts participant-specific busy blocks.
  - Computes the intersection of available free intervals across all selected participants.
  - Slices free intervals into candidate meeting slots of the requested duration (e.g., 45 minutes) and step granularity (e.g., 15 minutes).
  - Deterministically sorts suggested slots chronologically.
- **DST & Astronomical Accuracy**: Handles transitions like US DST Spring Forward on March 8, 2026 (`America/Los_Angeles` shifting from UTC-8 to UTC-7) without hardcoded offsets.
- **Localized Slot Presentation**: Every suggested slot provides canonical UTC ISO timestamps and localized time projections for each participant (`localStartTime`, `localEndTime`, `formattedLocalRange`, `dayOfWeek`, `tzAbbreviation`).
- **Intelligent Diagnostics & $(N-1)$ Compromises**: When no universal meeting slot exists, the system provides diagnostic reasoning (identifying specific pairwise timezone incompatibilities) and calculates viable $(N-1)$ and cluster subsets.
- **24-Hour Timezone Timeline Matrix**: Interactive visual overview comparing participant working hours relative to UTC.
- **One-Click Assignment Scenario Reset**: Pre-seeds the system with the 4 default participants from the assignment:
  - **Maya**: Bangalore (`Asia/Kolkata`, 09:00–18:00)
  - **Tom**: London (`Europe/London`, 08:00–17:00)
  - **Sara**: San Francisco (`America/Los_Angeles`, 06:00–15:00)
  - **Jack**: Sydney (`Australia/Sydney`, 10:00–19:00)

---

## 3. Tech Stack

### Frontend
- **React 18** + **Vite**: Ultra-fast build and reactive state orchestration without excessive dependencies.
- **JavaScript / JSX**: Clean, standard ES module syntax (no unnecessary TypeScript overhead).
- **Tailwind CSS**: Modern design system with dark palette, glassmorphism, glowing accents, and responsive layout.
- **Lucide Icons**: Crisp, accessible icon set.

### Backend
- **Node.js** + **Express.js**: Layered architecture (Controllers, Services, Repositories, Models, Validators, Middleware).
- **MongoDB** + **Mongoose**: Document persistence with structural unique compound indexes and pre-save invariant hooks.
- **Zod**: Robust request schema validation at the API boundary.
- **date-fns** & **date-fns-tz**: IANA timezone calculations and DST-aware transformations.
- **Helmet**, **CORS**, **express-rate-limit**, **Morgan**: Production security baseline and request observability.

### Testing
- **Vitest** + **Supertest**: High-performance unit and integration testing suite.
- **mongodb-memory-server**: Ephemeral, zero-dependency in-memory MongoDB runner ensuring tests execute out-of-the-box in any environment without external DB daemons.

---

## 4. Architecture

```text
Meeting-Scheduler/
├── client/
│   ├── src/
│   │   ├── api/             # API client with uniform error unwrapping
│   │   ├── components/      # UI components (SchedulerForm, SlotResults, ParticipantCard, etc.)
│   │   ├── utils/           # Timezone lists, formatters
│   │   ├── App.jsx          # Main application coordinator
│   │   ├── index.css        # Tailwind directives and design tokens
│   │   └── main.jsx         # React DOM entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/          # Environment variable validation & DB connection
│   │   ├── constants/       # Error codes, HTTP status, seed data
│   │   ├── controllers/     # HTTP route handlers (lean, zero business logic)
│   │   ├── errors/          # Custom error hierarchy (AppError, ValidationError, ConflictError, etc.)
│   │   ├── middleware/      # Error handler, rate limiter, request logger, Zod validator
│   │   ├── models/          # Mongoose schemas with compound indexes & pre-save invariants
│   │   ├── repositories/    # Database query abstraction
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Pure domain logic & interval mathematics
│   │   ├── utils/           # Interval algorithms, timezone transformers, API envelope
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.js           # Express app setup and middleware chain
│   │   └── server.js        # HTTP server listener and bootstrap
│   ├── tests/
│   │   ├── setup.js         # MongoMemoryServer lifecycle management
│   │   ├── unit/            # Interval math & timezone helper unit tests
│   │   └── integration/     # Express API and Database integrity integration tests
│   ├── vitest.config.js
│   ├── package.json
│   └── .env.example
│
├── PLAN.md
├── README.md
├── .env.example
├── .gitignore
└── package.json
```

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside `server` and `client` directories individually).*

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in `server/` (or use defaults):
```bash
cp server/.env.example server/.env
```

Default configuration values:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/meeting_scheduler
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

### 3. Run Locally (Development Mode)
Run both backend and frontend concurrently from the root:
```bash
npm run dev
```

Or run individually:
- **Server**: `npm run dev:server` (Available at `http://localhost:5000`)
- **Client**: `npm run dev:client` (Available at `http://localhost:5173`)

### 4. Seed Initial Assignment Data
The backend automatically checks and seeds the 4 assignment participants on startup if the database is empty. You can also manually trigger a clean seed via:
```bash
npm run seed
```
Or via the **Reset Seed Scenario** button directly in the web UI.

---

## 6. Running Tests

Run the complete test suite across unit, integration, and database integrity suites:

```bash
npm test
```

### Test Coverage Breakdown:
1. **`tests/unit/intervalMath.test.js`**: Half-open `[start, end)` interval intersections, contiguous merging, multi-participant intersections, busy block subtractions, and discrete slot slicing.
2. **`tests/unit/timezoneHelper.test.js`**: IANA timezone validation, rejection of informal abbreviations (e.g. `IST`, `PST`), US DST Spring Forward transition on March 8, 2026 (`America/Los_Angeles`), and localized date/time string formatting.
3. **`tests/integration/participants.api.test.js`**: Participant CRUD endpoints, 201 creation, 409 conflict on duplicate email, 400 on invalid timezone, 400 on inverted availability, and 404 on missing IDs.
4. **`tests/integration/meetings.api.test.js`**: Busy block creation, 400 rejection of inverted time ranges (`endTime <= startTime`), cascade deletion, and 404 participant checks.
5. **`tests/integration/scheduling.api.test.js`**: End-to-end 45-minute meeting search during 8–14 March 2026 across global participants, collision subtraction, and 4-way conflict diagnostics with $(N-1)$ fallback subsets.
6. **`tests/integration/databaseIntegrity.test.js`**: Verifies Mongoose schema-level constraints and MongoDB unique index enforcement directly at the persistence layer.

---

## 7. Database Model & Structural Constraints

### `participants` Collection
| Field | Type | Constraint | Enforcement Layer |
|---|---|---|---|
| `name` | `String` | Required, min 2 chars, trimmed | Validator + Mongoose Schema |
| `email` | `String` | Required, unique, lowercase, trimmed | Validator + MongoDB Unique Index (`{ email: 1 }`) |
| `location` | `String` | Required, trimmed | Validator + Mongoose Schema |
| `timezone` | `String` | Required, valid IANA identifier | Validator + Mongoose Schema Custom Validator |
| `availability` | `Object` | Required `{ startTime, endTime, daysOfWeek }` | Schema pre-validate hook (`startTime < endTime`) |

### `meetings` Collection
| Field | Type | Constraint | Enforcement Layer |
|---|---|---|---|
| `participantId` | `ObjectId` | Required, references `Participant` | Validator + Mongoose Schema (`index: true`) |
| `title` | `String` | Required, trimmed, default 'Busy Block' | Mongoose Schema |
| `startTime` | `Date` (UTC) | Required | Validator + Mongoose Schema |
| `endTime` | `Date` (UTC) | Required, strictly after `startTime` | Validator + Pre-validate hook (`startTime < endTime`) |

**Compound Index**: `{ participantId: 1, startTime: 1, endTime: 1 }` for optimal range filtering.

---

## 8. API Contract

All endpoints return a predictable uniform JSON envelope:

### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | INVALID_TIMEZONE | BUSINESS_RULE_VIOLATION | INTERNAL_SERVER_ERROR",
    "message": "Human readable message",
    "details": []
  }
}
```

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, uptime, and database connection state |
| `GET` | `/api/participants` | List all participants sorted by name |
| `POST` | `/api/participants` | Create a new participant (validates email uniqueness and IANA timezone) |
| `GET` | `/api/participants/:id` | Fetch a single participant by ID |
| `PUT` | `/api/participants/:id` | Update participant details or working availability |
| `DELETE` | `/api/participants/:id` | Delete a participant and cascade delete associated busy blocks |
| `GET` | `/api/participants/:id/meetings` | List all busy blocks for a participant |
| `POST` | `/api/participants/:id/meetings` | Log a busy block / meeting for a participant |
| `DELETE` | `/api/meetings/:id` | Remove a busy block |
| `POST` | `/api/scheduling/slots` | Calculate matching meeting slots for selected participants |
| `POST` | `/api/seed` | Reset and populate the 4 assignment default participants |

#### Scheduling Request Example:
`POST /api/scheduling/slots`
```json
{
  "participantIds": ["64a1b2c3d4e5f67890123456", "64a1b2c3d4e5f67890123457"],
  "startDate": "2026-03-08",
  "endDate": "2026-03-14",
  "durationMinutes": 45,
  "granularityMinutes": 15
}
```

#### Scheduling Response Example:
```json
{
  "success": true,
  "data": {
    "durationMinutes": 45,
    "granularityMinutes": 15,
    "searchWindow": {
      "startDate": "2026-03-08",
      "endDate": "2026-03-14"
    },
    "totalSlotsFound": 5,
    "hasUniversalSlots": true,
    "slots": [
      {
        "slotId": "2026-03-09T08:00:00.000Z_45m",
        "startUtc": "2026-03-09T08:00:00.000Z",
        "endUtc": "2026-03-09T08:45:00.000Z",
        "durationMinutes": 45,
        "participantTimes": [
          {
            "participantId": "64a1b2c3d4e5f67890123456",
            "name": "Maya",
            "location": "Bangalore",
            "timezone": "Asia/Kolkata",
            "localDate": "2026-03-09",
            "localStartTime": "13:30",
            "localEndTime": "14:15",
            "localStartTime12h": "1:30 PM",
            "localEndTime12h": "2:15 PM",
            "dayOfWeek": "Monday",
            "tzAbbreviation": "IST",
            "formattedLocalRange": "Mon, Mar 9, 2026, 1:30 PM – 2:15 PM (IST)"
          }
        ]
      }
    ]
  }
}
```

---

## 9. Important Non-Default Engineering Decisions

1. **Canonical Half-Open Intervals `[start, end)` in UTC**:
   All interval mathematics uses inclusive start and exclusive end. This eliminates boundary collision ambiguities: `[12:00, 13:00)` and `[13:00, 14:00)` do not conflict, allowing adjacent meetings without overlap errors.
2. **Strict IANA Timezone Validation & `date-fns-tz`**:
   Rather than naive string arithmetic or offset constants, availability is projected from local calendar days to UTC using `date-fns-tz`. This correctly reflects Daylight Saving Time transitions, such as `America/Los_Angeles` transitioning from UTC-8 to UTC-7 on March 8, 2026.
3. **Multi-Layer Business Invariant Enforcement**:
   - UI: Instant field validation and interactive restrictions.
   - API: Zod schema validators rejecting malformed payloads with 400 Bad Request.
   - Database: Compound unique indexes and Mongoose schema pre-validate hooks preventing race condition corruption. Duplicate key errors (`11000`) are mapped directly to `409 Conflict`.
4. **Multi-Tier Alternative Suggestions**:
   When global time zones have zero common overlap (e.g. Bangalore, London, SF, Sydney spanning 19 hours), the system does not return an empty screen. It executes pairwise root-cause analysis and computes $(N-1)$ and viable cluster subsets with localized times so coordinators have actionable options.
5. **Zero-Dependency Isolated Test Infrastructure**:
   Integration tests run against `mongodb-memory-server`, ensuring that `npm test` runs deterministically without requiring a pre-installed MongoDB daemon on developer machines.

---

## 10. Known Limitations

- **Calendar Provider Sync**: Pre-existing meetings are tracked natively within the application database rather than via live OAuth 2.0 webhooks with Google Calendar / Microsoft 365.
- **Granular Discrete Stepping**: Meeting slot generation uses a configurable discrete step (default 15 minutes) rather than arbitrary millisecond start times.
