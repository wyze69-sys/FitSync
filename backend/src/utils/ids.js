function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

module.exports = { createId };
