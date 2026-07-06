function parseDateOnly(value) {
  if (!value) return Number.NaN;
  const parsed = new Date(String(value).replace(/-/g, "/"));
  return parsed.getTime();
}

function parseTimestamp(value) {
  if (!value) return Number.NaN;
  const parsed = new Date(value);
  return parsed.getTime();
}

function getLogCreatedTime(log) {
  return parseTimestamp(log?.createdAt ?? log?.created_at ?? log?.created_at_utc);
}

export function isValidWeightLog(log) {
  if (!log || typeof log !== "object") return false;
  const weight = Number(log.weight);
  if (!Number.isFinite(weight) || weight <= 0) return false;
  if (!log.date) return false;
  return Number.isFinite(parseDateOnly(log.date));
}

export function sortWeightLogsOldestFirst(logs = []) {
  if (!Array.isArray(logs)) return [];

  return [...logs]
    .filter(isValidWeightLog)
    .sort((a, b) => {
      const dateDiff = parseDateOnly(a.date) - parseDateOnly(b.date);
      if (dateDiff !== 0) return dateDiff;

      const createdA = getLogCreatedTime(a);
      const createdB = getLogCreatedTime(b);
      if (Number.isFinite(createdA) && Number.isFinite(createdB) && createdA !== createdB) {
        return createdA - createdB;
      }
      if (Number.isFinite(createdA) && !Number.isFinite(createdB)) return -1;
      if (!Number.isFinite(createdA) && Number.isFinite(createdB)) return 1;

      return 0;
    });
}
