# Meeting Scheduler — Engineering Implementation Plan (PLAN.md)

This document establishes the architectural, domain, and mathematical plan for the Meeting Scheduler application prior to codebase implementation.

---

## 1. Problem Interpretation

The objective is to design and implement a time-zone-aware Meeting Scheduler for distributed teams located across the globe.

### Core Domain Aspects:
* **Participant Availability**: Normal working hours are configured strictly in each participant's *local* time (e.g. `09:00–18:00`). Because time zones and daylight-saving transitions shift relative offsets, a local working day is an evolving instant range when projected onto UTC.
* **Weekday Availability**: Business rules specify availability on standard working weekdays (Monday through Friday in the participant's local calendar). Weekends (Saturday and Sunday) are excluded. A date interval query spanning `2026-03-08` (Sunday) to `2026-03-14` (Saturday) must evaluate each participant's local weekday calendar independently.
* **Pre-existing Meetings**: Pre-existing meetings represent blocked intervals during which a participant cannot attend new meetings. Meetings must be subtracted from normal availability to produce the participant's *effective availability*.
* **Requested Duration**: The coordinator requests meeting slots of variable length (e.g. `45` minutes). Any candidate slot must fit entirely within the uninterrupted continuous overlap interval.
* **Date Range**: Queries define inclusive search boundaries (`startDate` to `endDate`). The scheduler evaluates all candidate days within the window.
* **Time Zones**: Real-world locations (Bangalore, London, San Francisco, Sydney) map to standard IANA timezone identifiers (`Asia/Kolkata`, `Europe/London`, `America/Los_Angeles`, `Australia/Sydney`). No hardcoded UTC offsets are allowed.
* **Suggested Slots**: Valid continuous common free intervals are discretized into candidate slots (e.g. in 15-minute start increments).
* **Fallback Behavior**: When distributed across 4 distinct global quadrants (e.g. Bangalore, London, San Francisco, Sydney), a universal 4-way overlap during normal weekday working hours is mathematically impossible without at least one participant meeting outside their normal hours. The system must not return an empty result; instead, it generates ranked alternative candidate slots, maximizes participant coverage, and explicitly reports each participant's availability and conflict reasons.

---

## 2. Architecture

The application adopts a clean, layered modular monolithic architecture with strict separation of concerns:

```
┌──────────────────────────────────────────────────────────┐
│                   React + Vite UI Layer                  │
│  - Participants & Availabilities Management              │
│  - Existing Meetings Management (Timezone-Aware Input)   │
│  - Interactive Scheduler (Date Range, Duration)          │
│  - Slot Results Visualizer (Full Matches vs Alternatives)│
│  - Local Time Breakdown Cards with IANA & TZ Names       │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP / JSON (REST)
┌────────────────────────────▼─────────────────────────────┐
│                   API Controller Layer                   │
│  - Express.js HTTP Router                                │
│  - Request Validation using Zod Schemas                  │
│  - Standardized JSON Envelope & Error Formatter          │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│               Scheduling & Domain Service                │
│  - Timezone Conversion (Luxon IANA / Olson Database)     │
│  - Interval Algebra (Intersection, Difference, Slicing)  │
│  - Universal Slot Generator (Full Match Search)          │
│  - Ranked Alternative Recommender (Partial Match Search) │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                 Persistence Layer (SQLite)               │
│  - Better-SQLite3 with PRAGMA foreign_keys = ON          │
│  - Strict Column Checks, Non-Null & Cascade Constraints  │
│  - Seed Data Loader for Default Scenario Team            │
└──────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
1. **Presentation (UI)**: Dispatches user requests, renders live local times for each participant, shows availability badges, and allows slot selection.
2. **API Layer (`/api`)**: Translates HTTP inputs, enforces validation rules, maps domain exceptions to standard HTTP error codes (`400`, `404`, `422`, `500`), and formats deterministic JSON responses.
3. **Domain Layer (`domain/`)**: Pure business logic containing interval mathematics, IANA timezone handling, and the scheduling algorithms. Completely decoupled from HTTP frameworks and databases for 100% testability.
4. **Data Access Layer (`db/`)**: Relational SQLite storage with foreign key cascades and check constraints.

---

## 3. Data Model

### Relational Schema (SQLite with `PRAGMA foreign_keys = ON`):

#### 1. `participants`
Stores participant identity and their home IANA timezone.
* `id`: `TEXT PRIMARY KEY` (UUID v4)
* `name`: `TEXT NOT NULL`
* `location`: `TEXT NOT NULL` (Display location, e.g. "Bangalore")
* `timezone`: `TEXT NOT NULL` (Valid IANA timezone identifier, e.g. "Asia/Kolkata")
* `created_at`: `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`

#### 2. `availabilities`
Stores recurring normal working hours in participant-local time.
* `id`: `TEXT PRIMARY KEY` (UUID v4)
* `participant_id`: `TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE`
* `day_of_week`: `INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7)` (1 = Monday, ..., 5 = Friday, 6 = Saturday, 7 = Sunday)
* `start_time`: `TEXT NOT NULL CHECK(length(start_time) = 5)` (Format `HH:mm`, e.g. "09:00")
* `end_time`: `TEXT NOT NULL CHECK(length(end_time) = 5)` (Format `HH:mm`, e.g. "18:00")
* `CHECK(start_time < end_time)`
* `UNIQUE(participant_id, day_of_week, start_time, end_time)`

#### 3. `meetings`
Stores pre-existing busy times / scheduled events.
* `id`: `TEXT PRIMARY KEY` (UUID v4)
* `participant_id`: `TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE`
* `title`: `TEXT NOT NULL`
* `start_time`: `TEXT NOT NULL` (ISO-8601 UTC Instant, e.g. `2026-03-09T07:30:00.000Z`)
* `end_time`: `TEXT NOT NULL` (ISO-8601 UTC Instant, e.g. `2026-03-09T08:30:00.000Z`)
* `CHECK(start_time < end_time)`

---

## 4. Time-zone Strategy

### Fundamental Principles:
1. **Explicit IANA Timezones**:
   * Locations are represented by official IANA time zone strings (`Asia/Kolkata`, `Europe/London`, `America/Los_Angeles`, `Australia/Sydney`).
   * Timezone strings are validated using standard Olson database verification.
2. **Local Availability Interpretation**:
   * Working hours (`09:00–18:00`) have no fixed UTC offset.
   * For any specific calendar date $D$ in a participant's local timezone $Z$, local start instant $T_{start} = \text{parse}(D, \text{start\_time}, Z)$ and local end instant $T_{end} = \text{parse}(D, \text{end\_time}, Z)$.
3. **UTC Normalization**:
   * Once local start/end instants are constructed in the context of the participant's IANA timezone, they are converted into standardized UTC intervals: $[T_{start\_utc}, T_{end\_utc}]$.
4. **Daylight Saving Time (DST) Transitions**:
   * In the test scenario week of **8–14 March 2026**:
     * `America/Los_Angeles` transitions from PST (UTC-8) to PDT (UTC-7) on **Sunday, March 8, 2026 at 02:00 local time**.
     * Weekdays March 9–13 operate in PDT (UTC-7). 06:00–15:00 PDT corresponds to 13:00–22:00 UTC.
     * `Europe/London` is in GMT (UTC+0) in early March (BST begins late March).
     * `Australia/Sydney` is in AEDT (UTC+11) (DST ends in April).
     * `Asia/Kolkata` is in IST (UTC+5:30) with no DST.
   * Using **Luxon** (`DateTime.fromObject({ year, month, day, hour, minute }, { zone: ianaZone })`) ensures that DST offsets and ambiguous/gap hours are resolved accurately by the underlying IANA rules rather than arbitrary offset arithmetic.
5. **Why Native JavaScript `Date` is Insufficient**:
   * Native JS `Date` evaluates dates in either the host machine's local system timezone or UTC.
   * Constructing a local time for another timezone using native `Date` requires manual offset parsing or complex string formatting tricks, which fail across DST transition boundaries or historical rule changes.
   * Luxon provides immutable `DateTime` and `Interval` objects backed by the IANA database via `Intl`.

---

## 5. Scheduling Algorithm

The scheduling engine operates via deterministic interval algebra:

```
For each participant P:
  1. Determine local calendar dates spanning the search window [startDate, endDate].
  2. For each local date D:
     a. If D is an active availability weekday (e.g. Mon-Fri):
        i. Construct local start DateTime: D + P.start_time in P.timezone.
        ii. Construct local end DateTime: D + P.end_time in P.timezone.
        iii. Convert to UTC Interval: [startUTC, endUTC].
  3. Combine all availability intervals into a normalized set of disjoint UTC intervals.
  4. For each existing meeting M of participant P (converted to UTC):
     a. Subtract [M.startUTC, M.endUTC] from P's availability intervals using interval difference.
  5. The remaining intervals form Participant P's "Effective Available Intervals".

Universal Overlap (Full Matches):
  6. Compute the mathematical intersection of Effective Available Intervals across ALL selected participants.
  7. Filter resulting intervals to those with duration >= requestedDurationMinutes.
  8. Discretize each qualifying interval into candidate slots:
     - Slot 1: [interval.start, interval.start + duration]
     - Slot 2: [interval.start + step, interval.start + step + duration] (step = 15 min)
     - Until: slot.end > interval.end.

Candidate Projection & Formatting:
  9. For each candidate slot [slotStartUTC, slotEndUTC]:
     a. Convert UTC instants into each participant's local timezone.
     b. Extract formatted local time (e.g. "09:00 – 09:45"), local date, timezone abbreviation (e.g. "IST", "PDT", "GMT", "AEDT"), and local offset (e.g. "+05:30").
```

---

## 6. No-Common-Slot Strategy (Ranked Alternatives)

When participants are distributed such that no single continuous slot fits all $N$ participants (or to provide backup options when full matches are constrained):

### Partial Overlap & Conflict Evaluation Engine:
1. **Candidate Slot Universe Generation**:
   * Generate potential candidate time slots (with 15-minute or 30-minute granularity) across the union of all participants' available working windows within the requested date range.
2. **Participant Status Evaluation**:
   For each candidate slot $[S_{utc}, E_{utc}]$, evaluate every participant $P$:
   * **`AVAILABLE`**: The slot falls completely within $P$'s normal working hours on that day AND $P$ has no conflicting meeting.
   * **`BUSY_MEETING`**: The slot overlaps one or more of $P$'s pre-existing meetings (reports conflicting meeting title and time).
   * **`OUTSIDE_HOURS`**: The slot falls outside $P$'s configured working hours for that local date.
3. **Alternative Ranking Function**:
   Slots are sorted deterministically using multi-tiered criteria:
   * **Tier 1 — Participant Attendance Count ($\downarrow$)**: Highest number of available participants (e.g. 3 of 4 participants > 2 of 4 participants).
   * **Tier 2 — Conflict Severity ($\downarrow$)**: Fewer meeting collisions (preferring scheduling during working hours with 1 missing person over double-booking).
   * **Tier 3 — Proximity to Search Start ($\uparrow$)**: Earliest suitable date/time.
4. **Structured Explanation**:
   Every returned alternative slot explicitly includes:
   * Available participant count (e.g. `3/4 participants available`).
   * Breakdown of missing participants and why they cannot attend (e.g. `"Jack is outside working hours (02:00 AEDT)"` or `"Maya has a conflicting meeting: Quarterly Review"`).
   * Local representations for ALL participants so coordinators can instantly identify who needs an exception or follow-up recording.

---

## 7. API Contract

### Response Wrapper:
All API responses adhere to standard JSON envelopes:
* Success: `{ "data": ... }`
* Error: `{ "error": { "code": "...", "message": "...", "details": { ... } } }`

### Endpoints:

#### 1. `GET /api/participants`
* **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "c1f7a230-...",
      "name": "Maya",
      "location": "Bangalore",
      "timezone": "Asia/Kolkata",
      "availabilities": [
        { "id": "...", "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00" }
      ]
    }
  ]
}
```

#### 2. `POST /api/participants`
* **Request**:
```json
{
  "name": "Maya",
  "location": "Bangalore",
  "timezone": "Asia/Kolkata",
  "availabilities": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 4, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 5, "startTime": "09:00", "endTime": "18:00" }
  ]
}
```
* **Response**: `201 Created`

#### 3. `GET /api/meetings`
* **Query Params**: `participantId` (optional)
* **Response**: `200 OK`

#### 4. `POST /api/meetings`
* **Request**:
```json
{
  "participantId": "c1f7a230-...",
  "title": "Design Sync",
  "startTime": "2026-03-09T10:00:00.000Z",
  "endTime": "2026-03-09T11:00:00.000Z"
}
```
* **Response**: `201 Created`

#### 5. `DELETE /api/meetings/:id`
* **Response**: `204 No Content`

#### 6. `POST /api/schedule/search`
* **Request**:
```json
{
  "participantIds": ["id-maya", "id-tom", "id-sara", "id-jack"],
  "startDate": "2026-03-08",
  "endDate": "2026-03-14",
  "durationMinutes": 45
}
```
* **Response**: `200 OK`
```json
{
  "data": {
    "searchCriteria": {
      "startDate": "2026-03-08",
      "endDate": "2026-03-14",
      "durationMinutes": 45,
      "totalParticipants": 4
    },
    "fullMatches": [],
    "alternatives": [
      {
        "startUtc": "2026-03-09T08:00:00.000Z",
        "endUtc": "2026-03-09T08:45:00.000Z",
        "availableCount": 3,
        "totalCount": 4,
        "isFullMatch": false,
        "participants": [
          {
            "participantId": "id-maya",
            "name": "Maya",
            "timezone": "Asia/Kolkata",
            "status": "AVAILABLE",
            "startLocal": "13:30",
            "endLocal": "14:15",
            "dateLocal": "2026-03-09",
            "tzAbbreviation": "IST"
          },
          {
            "participantId": "id-tom",
            "name": "Tom",
            "timezone": "Europe/London",
            "status": "AVAILABLE",
            "startLocal": "08:00",
            "endLocal": "08:45",
            "dateLocal": "2026-03-09",
            "tzAbbreviation": "GMT"
          },
          {
            "participantId": "id-jack",
            "name": "Jack",
            "timezone": "Australia/Sydney",
            "status": "AVAILABLE",
            "startLocal": "19:00",
            "endLocal": "19:45",
            "dateLocal": "2026-03-09",
            "tzAbbreviation": "AEDT"
          },
          {
            "participantId": "id-sara",
            "name": "Sara",
            "timezone": "America/Los_Angeles",
            "status": "OUTSIDE_HOURS",
            "conflictReason": "Outside working hours (06:00-15:00)",
            "startLocal": "01:00",
            "endLocal": "01:45",
            "dateLocal": "2026-03-09",
            "tzAbbreviation": "PDT"
          }
        ]
      }
    ]
  }
}
```

---

## 8. Testing Strategy

The test suite will use **Vitest** + **Supertest** with dedicated test suites:

### 1. Scheduling Algorithm Unit Tests (`server/test/scheduler.test.ts`):
* **Basic Overlap**: Overlapping availability intervals among participants in different time zones.
* **No Overlap**: Mutual exclusion across time zones produces 0 full matches and returns ranked alternatives.
* **Existing Meetings**: A meeting correctly subtracts a middle slice, leaving two valid split intervals.
* **Multiple & Adjacent Meetings**: Handling contiguous or stacked meetings without interval corruption.
* **Boundary Conditions**: Meeting starting exactly at availability start, or ending exactly at availability end.
* **Exact Fit vs Too Short**: 45-minute request on a 45-minute window matches; 45-minute request on a 40-minute window fails.
* **Weekend Exclusion**: Weekday-only rules correctly exclude Saturday/Sunday even if within requested date range.
* **DST Shift (March 8, 2026)**: Verify `America/Los_Angeles` changes offset from UTC-8 to UTC-7, resulting in correct UTC working intervals (13:00–22:00 UTC) on March 9.

### 2. Integration / API Tests (`server/test/api.test.ts`):
* Full CRUD flow: Create participant $\to$ query $\to$ create meeting $\to$ execute schedule search.
* Validation failure tests: Invalid IANA timezones (e.g. "Fake/Zone"), negative durations, meeting end before start, empty participant IDs.
* Consistent error envelope verification (`{ error: { code, message } }`).

### 3. Database Constraint Tests (`server/test/database.test.ts`):
* Foreign key enforcement (inserting meeting for nonexistent participant throws constraint error).
* Check constraint enforcement (`start_time < end_time` on meetings and availabilities).
* Cascade deletion verification (deleting a participant automatically removes their meetings and availabilities).

---

## 9. Tradeoffs & Timebox Decisions

In accordance with the 4-hour timebox, the following deliberate tradeoffs were made:
1. **Embedded SQLite with Better-SQLite3**: Chosen over Postgres/Docker to ensure zero external setup friction for evaluators while maintaining 100% ACID relational integrity, strict foreign keys, and check constraints.
2. **Discrete 15-Minute Slot Slicing**: Slices continuous free intervals on 15-minute marks rather than infinite granular instants to keep response sizes reasonable and actionable for coordinators.
3. **Single-Service Architecture (Modular Monolith)**: Kept backend API, domain scheduling engine, and SQLite persistence in a clean single Node/TypeScript package with a Vite React frontend, avoiding microservice or message queue overhead.
4. **Recurring Pattern Scope**: Normal availability supports day-of-week recurring rules (Monday–Friday). Custom bi-weekly or irregular holiday schedules were omitted as unnecessary for the scope.
5. **No Authentication Layer**: The prompt specifies an internal tool; auth mechanisms (OAuth/JWT) were omitted to focus 100% on scheduling correctness, timezone fidelity, and testing.
