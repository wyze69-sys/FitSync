const { randomUUID } = require("crypto");

/**
 * Generate a collision-resistant, prefixed identifier.
 * Uses crypto.randomUUID() so ids are unique across processes and restarts.
 * Example: createId("wk") -> "wk_3f1c8e0a-9b2d-4c7e-8a1f-2b6d9c4e5f70"
 * @param {string} prefix - Short label describing the entity (e.g. "usr", "wk").
 * @returns {string} A unique identifier.
 */
function createId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

module.exports = { createId };
