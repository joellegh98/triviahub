[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/kOiMG7jt)

## Student names and id

- Noa Haberer - 209829845
- Joelle Gharo - 328295423

---

## Student Emails

- noahab@edu.jmc.ac.il
- joellegh@edu.jmc.ac.il

---

## Project overview

TriviaHub is a single-page quiz application built with React (TypeScript) in `frontend/` and a Spring Boot backend in the repository root. The UI loads quizzes, questions, and leaderboard data from the REST API (`frontend/src/api.ts`, proxied to `http://localhost:8080`). The file `frontend/src/mockData.js` is kept as reference seed content only and is no longer imported by the app.

The app includes seven routes: Home, Quiz Browser, Play, Results, Global Leaderboard, Admin CRUD, and About.

---

## How to run the exercise

### Phase 1

1. IntelliJ run config
2. Open a terminal in `frontend/`.
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Open the URL shown in the terminal (Vite default is `http://localhost:5173`).

### Phase 2 (API-backed UI)

1. From the repo root, run **DataInit** once so `quizzes.ser`, `questions.ser`, and `results.ser` exist (same working directory you use for the backend).
2. Start the Spring Boot app on port **8080** (`TriviaHubApplication`).
3. In `frontend/`, run `npm run dev`. The Vite dev server proxies `/api` to the backend (`frontend/vite.config.ts`).

---

## Score calculation

The final score is an integer from 0 to 100. It is computed on the Results page from the game session passed through React Router state (`correctAnswers`, `totalQuestions`, `durationSec`, `hintsUsed`). The same formula should be used anywhere the score is calculated (frontend and backend in Phase 2).

If `totalQuestions` is missing or not greater than zero, the score is `0`.

Otherwise:

1. **Accuracy (up to 80 points)**  
   `accuracyPart = (correctAnswers / totalQuestions) * 80`

2. **Time bonus (up to 20 points)**  
   Duration is clamped to the range 0–180 seconds.  
   `timePart = ((180 - boundedDuration) / 180) * 20`  
   Faster runs earn more of the 20 points; at 180 seconds or more, the time bonus is 0.

3. **Hint penalty**  
   Each hint used subtracts 4 points: `hintPenalty = hintsUsed * 4`

4. **Final score**  
   `rawScore = accuracyPart + timePart - hintPenalty`  
   The result is rounded to the nearest integer and clamped to the range 0–100.

**Example:** 4 correct out of 5, 78 seconds, 1 hint used:

- Accuracy: `(4/5) * 80 = 64`
- Time: `((180 - 78) / 180) * 20 ≈ 11.33`
- Hints: `1 * 4 = 4`
- Raw: `64 + 11.33 - 4 ≈ 71.33` → **71**

Implementation reference: `computeScore` in `frontend/src/utils/computeScore.ts`.

---


---

## Limitations

- Global “games on leaderboard” on the home page counts entries returned by `GET /api/leaderboard` (up to 20), not every saved game in storage.
- `POST /results` (save after a run) is wired in P2-7; the results page still merges the current session into the displayed top-10 for preview.
