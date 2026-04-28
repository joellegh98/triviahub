---
name: TriviaHub phases
overview: Plan the project in two phases (Phase 1 frontend-only with mock data; Phase 2 backend + hooks), broken into small incremental milestones aligned to routes, CRUD, and gameplay.
todos:
  - id: p1-routing
    content: Implement all Phase 1 routes/pages and shared Bootstrap layout/nav.
    status: pending
  - id: p1-mockdata
    content: Create mockData.js with ≥3 quizzes × ≥5 questions; implement quiz browser filter/search.
    status: pending
  - id: p1-game-results-admin
    content: Implement Phase 1 gameplay, results, leaderboard, and admin local CRUD with validations.
    status: pending
  - id: p2-backend-ser
    content: Build Spring Boot backend with Serializable models, ObjectStream persistence, DataInit, and race-condition protection.
    status: pending
  - id: p2-api-hooks
    content: "Replace mock data with API calls and required hooks: useEffect/useContext/useReducer/useMemo/useCallback + custom hooks; integrate admin + gameplay + leaderboards."
    status: pending
  - id: docs-readme
    content: Add required JSDoc/Javadoc and complete README with score formula + run instructions.
    status: pending
isProject: false
---

# TriviaHub – Two-Phase Implementation Plan

## Scope recap (from PDF)

- **App**: TriviaHub SPA (React) with **7 routes** + admin CRUD + gameplay + leaderboards.
- **Phase 1 (due 19/05/2026 23:59)**: **React frontend only**, **static mock data**, React Router v6 + props + `useState` (admin may use `useReducer`). **No backend**.
- **Phase 2 (due 02/06/2026 23:59)**: **Spring Boot REST backend + file persistence via Java ObjectStreams** + React hooks/patterns: `useEffect`, `useContext`, `useReducer`, `useMemo`, `useCallback`, **custom hooks**. Replace mock data with API calls. Handle specified error cases.

## Key requirements to keep visible throughout

- **Routes (React Router v6 / BrowserRouter)**:
    - `/` Home (stats)
    - `/quizzes` Quiz Browser (cards + category filter from API on refresh + title search)
    - `/play/:quizId` Game screen (progress, stopwatch, attempts, hint once per question, quit modal)
    - `/results/:quizId` Results (save result on mount, show top-10 leaderboard for quiz, handle server unavailable)
    - `/leaderboard` Global leaderboard top-20 sortable
    - `/admin` Admin CRUD quizzes + questions
    - `/about` About
- **UI**: Bootstrap 5, responsive, **no `alert()`** (use Modals/Alerts/Toasts).
- **Score**: you must define a formula (max 100; accuracy primary; time capped; hints reduce score) and **document it in `README.md`**; graders will match code to README.
- **Backend persistence**: serialize to **exact files**: `quizzes.ser`, `questions.ser`, `results.ser`.
- **Concurrency**: .ser files may be accessed concurrently by requests → implement race-condition protection.
- **Validation rules**:
    - Quiz: title non-empty; category letters a–z only; no duplicate titles (case-insensitive)
    - Question: text non-empty; exactly 4 non-empty options; correctIndex 0–3
    - Delete quiz deletes all its questions
- **Docs**: **JSDoc** on every React component + custom hook; **Javadoc** on each Spring controller + service method.

---

## Phase 1 plan (frontend-only, mock data)

### P1-0 Project baseline

- Create/verify structure with a Vite React app in `frontend/` and route pages in `frontend/src/pages/`.
- Add Bootstrap 5 (CSS + any needed JS for Modals/Toasts) and a shared layout with a top nav.

### P1-1 Routing skeleton (ship visible navigation early)

- Add React Router v6 `BrowserRouter` with page components for all required routes:
    - `HomePage` (`/`)
    - `QuizzesPage` (`/quizzes`)
    - `PlayPage` (`/play/:quizId`)
    - `ResultsPage` (`/results/:quizId`)
    - `LeaderboardPage` (`/leaderboard`)
    - `AdminPage` (`/admin`)
    - `AboutPage` (`/about`)
- Add a “Not found” fallback route.

### P1-2 Mock data model (single source of truth)

- Create `frontend/src/mockData.js` with:
    - **≥3 quizzes**, each with **≥5 questions**
    - ≥2 categories total
- Decide and encode consistent mock shapes for Quiz/Question/GameResult so Phase 2 migration is straightforward.

### P1-3 Home page (stats + navigation)

- Compute from mock data:
    - total quizzes
    - total questions
    - total games played (for Phase 1: from a local in-memory results array)
- Add prominent buttons to `/quizzes` and `/leaderboard`.

### P1-4 Quiz Browser page (filter + search)

- Render quizzes as Bootstrap cards showing:
    - title, category, question count, Play button
- Implement **category filter** with `useState`.
- Implement **client-side title search** (input + derived filtered list).
- Wire Play button to `/play/:quizId`.

### P1-5 Game screen (useState state machine)

- On mount, load and **shuffle** questions for `quizId`.
- Implement “one question at a time” flow:
    - progress indicator (N of M)
    - stopwatch (seconds elapsed)
    - attempt counter
    - answer selection (4 choices)
    - feedback “correct/incorrect” briefly before next question
    - Hint button (only once per question) that reveals hint and increments hints-used
    - Quit button shows **Bootstrap Modal confirm**; quitting returns to `/quizzes` without saving
- Handle Phase 1 edge case: if quiz has 0 questions (shouldn’t in mock), show warning and return.

### P1-6 Results page (local results + static leaderboard)

- Compute score using your chosen formula (even in Phase 1).
- Show: score, correct answers, total, duration, hints used.
- Show a **mock leaderboard top-10** for this quiz (static data or derived from local results).
- Ensure “Save on mount” logic is **deferred to Phase 2**; Phase 1 can just display.

### P1-7 Global leaderboard page

- Display top-20 across all quizzes (mock/local results) with sort controls: score/date/player name.

### P1-8 Admin page (local CRUD only)

- Implement:
    - Add/delete quizzes locally (required); optionally edit.
    - Add/edit/delete questions locally (to match Phase 2 UX), enforcing validations.
    - Prevent duplicate quiz titles (case-insensitive).
    - Deleting a quiz removes its questions.
- Use Bootstrap forms + inline validation messages; no `alert()`.

### P1-9 About page

- Short app description + submitters’ names.

### P1-10 Phase 1 polish + submission readiness

- Verify every route is reachable from nav.
- Ensure responsive layout on tablet width.
- Remove/avoid console errors.

---

## Phase 2 plan (backend + hooks + integration)

### P2-0 Backend scaffold and persistence layer

- Create Spring Boot project at repo root (as per PDF layout) with packages:
    - `controller/`, `model/`, `service/`, `init/`
- Implement models (Serializable): `Quiz`, `Question`, `GameResult` with required fields.
- Implement a storage/service layer that reads/writes:
    - `quizzes.ser`, `questions.ser`, `results.ser`
- Add **race-condition protection** around file access (e.g., per-file locks) so concurrent requests don’t corrupt data.

### P2-1 DataInit seeding

- Implement `init/DataInit.java` runnable standalone `main()` that creates the three `.ser` files with:
    - ≥3 quizzes
    - ≥5 questions each
    - ≥2 categories
- Ensure id fields are UUIDs and categories/titles stored lowercase (as required).

### P2-2 REST API endpoints (with Javadoc + proper status codes)

Implement controllers + services with explicit exception handling and JSON error bodies.

**Quiz endpoints**

- List all quizzes (include question count)
- Get quiz by id
- Create quiz (409 on duplicate title)
- Update quiz
- Delete quiz (also deletes its questions)

**Question endpoints**

- List all questions for quiz
- “Random order” questions for game
- Add question
- Update question
- Delete question

**Results endpoints**

- Global leaderboard (top results)
- Leaderboard for a quiz (top 10)
- Save a game result

### P2-3 Frontend API layer + useEffect correctness

- Replace `mockData.js` usage with API calls.
- Create a small API client module (fetch wrappers) and ensure **every fetch is done via `useEffect` with correct dependency arrays**.

### P2-4 Introduce useContext for shared app data

- Add a context (e.g., `AppDataContext`) to share quiz lists/categories/loading/error state and refresh actions across pages.
- Use Bootstrap alerts/banners for global error states.

### P2-5 Quiz Browser integration + required error behavior

- Category filter dropdown must be **populated via API on every refresh/render cycle as specified** (implemented as “fetch categories on mount and on explicit refresh”).
- Implement required error behavior:
    - Server unavailable at startup → show banner and **disable Play buttons**.
    - Quiz deleted while browsing → redirect to `/quizzes` and show toast.

### P2-6 Game screen refactor to useReducer + custom hook

- Implement game state machine using `useReducer` (Phase 2 requirement).
- Extract strict game logic into a **custom hook** (e.g., `useGameEngine`) used by `PlayPage`.
- Use `useCallback` for dispatching stable handlers; use `useMemo` for derived UI state (progress, computed score preview, shuffled questions, etc.).

### P2-7 Results save-on-mount + backend leaderboard

- On `ResultsPage` mount, POST `GameResult` to backend.
- If save fails (server down), show Bootstrap alert “could not be saved” but still show local results.
- Fetch and display quiz leaderboard top-10 from backend.

### P2-8 Admin CRUD persisted to backend

- Wire quiz CRUD to API with proper error handling:
    - duplicate quiz title (409) → inline field error, do not clear form
- Wire question CRUD to API with validations.
- Ensure delete quiz triggers deletion of its questions server-side.

### P2-9 Leaderboard integration

- Global leaderboard top-20 from backend.
- Sorting by score/date/player name (either server or client, but must behave correctly).

### P2-10 Documentation + README completeness

- Add **JSDoc** for every component and custom hook.
- Add **Javadoc** for every controller/service method.
- Update `README.md` with:
    - exact score formula explanation
    - compile/run instructions: DataInit, backend (8080), frontend (`npm run dev`)
    - limitations (if any)

### P2-11 Final verification checklist

- Confirm all specified error cases are implemented and reset-on-retry behavior exists.
- Confirm no `alert()` anywhere.
- Confirm Bootstrap Modals/Toasts used where required.
- Confirm `.ser` files named exactly and stable under concurrent requests.

