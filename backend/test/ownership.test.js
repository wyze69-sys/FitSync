/**
 * Ownership / authorization tests.
 *
 * Proves that one user cannot edit or delete another user's workout or progress
 * data. The service layer rejects cross-user access (404), and the repository
 * delete is additionally scoped in SQL with "WHERE id = ? AND user_id = ?".
 *
 * These tests stub the repository methods (no database needed) so they verify
 * the authorization logic in isolation. Run: `npm test`.
 */

const test = require("node:test");
const assert = require("node:assert");

const { workoutRepository } = require("../src/repositories/workoutRepository");
const { weightRepository } = require("../src/repositories/weightRepository");
const { workoutService } = require("../src/services/workoutService");
const { progressService } = require("../src/services/progressService");

test("a user cannot edit another user's workout", async () => {
  const original = workoutRepository.getWorkoutById;
  // The workout belongs to "owner".
  workoutRepository.getWorkoutById = async () => ({
    id: "wk_1",
    userId: "owner",
    title: "Leg Day",
    date: "2026-05-01",
    notes: "",
    exercises: []
  });

  try {
    await assert.rejects(
      () =>
        workoutService.updateWorkout("attacker", "wk_1", {
          date: "2026-05-02",
          title: "Hacked",
          notes: "",
          exercises: [{ exerciseName: "Squats", duration: 10, caloriesBurned: 50, sets: [] }]
        }),
      (err) => err.status === 404,
      "attacker editing owner's workout must be rejected with 404"
    );
  } finally {
    workoutRepository.getWorkoutById = original;
  }
});

test("a user cannot delete another user's workout (delete is user-scoped)", async () => {
  const original = workoutRepository.deleteWorkout;
  let receivedArgs = null;
  // Simulate the scoped "DELETE ... WHERE id = ? AND user_id = ?" matching no rows.
  workoutRepository.deleteWorkout = async (id, userId) => {
    receivedArgs = { id, userId };
    return false;
  };

  try {
    await assert.rejects(
      () => workoutService.deleteWorkout("attacker", "wk_1"),
      (err) => err.status === 404
    );
    // The acting user's id must be forwarded into the scoped delete.
    assert.deepStrictEqual(receivedArgs, { id: "wk_1", userId: "attacker" });
  } finally {
    workoutRepository.deleteWorkout = original;
  }
});

test("a user cannot delete another user's weight log (delete is user-scoped)", async () => {
  const original = weightRepository.deleteWeightLog;
  let receivedArgs = null;
  weightRepository.deleteWeightLog = async (id, userId) => {
    receivedArgs = { id, userId };
    return false;
  };

  try {
    await assert.rejects(
      () => progressService.deleteWeightLog("attacker", "w_1"),
      (err) => err.status === 404
    );
    assert.deepStrictEqual(receivedArgs, { id: "w_1", userId: "attacker" });
  } finally {
    weightRepository.deleteWeightLog = original;
  }
});
