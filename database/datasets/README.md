# App Datasets

## nutrition_foods.csv

`nutrition_foods.csv` is the cleaned, app-ready nutrition dataset for FitSync. It
contains the normalized food rows used by the backend (id, name, serving size,
calories, protein, carbs, fat, fiber, sugar, sodium, and source metadata).

### How it is used

- The backend seeds the `nutrition_foods` table from this CSV. The loader lives at
  `backend/src/data/nutritionFoodDataset.js` and reads the file from this path.
- The backend exposes food data through the `/api/nutrition` endpoints.
- The frontend must consume food data via `/api/nutrition` through `nutritionService`.
- No frontend food data should be hardcoded; the CSV is the single source of truth.

### Notes

- The dataset holds roughly 2395 food rows (plus a header line).
- Edits here directly affect what the backend seeds and serves, so keep the column
  headers and normalized fields intact.
