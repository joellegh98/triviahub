# Grade Report — noa_haberer-joelle_gharo (Noa Haberer, Joelle Gharo)

**Final grade: 98.5 / 100**

## Requirement deductions

| # | Requirement | Points lost | Reason |
|---|---|---|---|
| 12.2 | Write atomicity/consistency: compound & multi-file ops atomic (no lost updates) | -1.5 | PARTIAL: single-file updateAll atomic, BUT cascade = updateAll(quizzes) then questionService.deleteByQuizId (separate) -> multi-file cascade not atomic. |


---
_Generated 2026-06-17 from the atomic requirements checklist. Not committed to git._
