/**
 * Maps backend badge/achievement data to local FitSync badge art.
 *
 * Single visual family:
 *   - XP LEVEL emblems (./assets/badges/xp-levels/) -> 12 user-provided
 *     level/rank images, one image per XP level.
 *
 * This is a pure presentation helper. It does NOT change backend data: the
 * database `icon` (emoji) field, badge codes, names and CRUD all stay intact.
 */

import xpLevel01 from "../assets/badges/xp-levels/xp_level_01.png";
import xpLevel02 from "../assets/badges/xp-levels/xp_level_02.png";
import xpLevel03 from "../assets/badges/xp-levels/xp_level_03.png";
import xpLevel04 from "../assets/badges/xp-levels/xp_level_04.png";
import xpLevel05 from "../assets/badges/xp-levels/xp_level_05.png";
import xpLevel06 from "../assets/badges/xp-levels/xp_level_06.png";
import xpLevel07 from "../assets/badges/xp-levels/xp_level_07.png";
import xpLevel08 from "../assets/badges/xp-levels/xp_level_08.png";
import xpLevel09 from "../assets/badges/xp-levels/xp_level_09.png";
import xpLevel10 from "../assets/badges/xp-levels/xp_level_10.png";
import xpLevel11 from "../assets/badges/xp-levels/xp_level_11.png";
import xpLevel12 from "../assets/badges/xp-levels/xp_level_12.png";

export const RANK_ART = {
  level_01: xpLevel01,
  level_02: xpLevel02,
  level_03: xpLevel03,
  level_04: xpLevel04,
  level_05: xpLevel05,
  level_06: xpLevel06,
  level_07: xpLevel07,
  level_08: xpLevel08,
  level_09: xpLevel09,
  level_10: xpLevel10,
  level_11: xpLevel11,
  level_12: xpLevel12,

  // Semantic aliases for non-numeric fallback matching.
  bronze: xpLevel01,
  silver: xpLevel03,
  gold: xpLevel05,
  platinum: xpLevel08,
  diamond: xpLevel10,
  champion: xpLevel12,
  legendary: xpLevel12,
  streak: xpLevel06,
  strength: xpLevel07,
  cardio: xpLevel07,
  consistency: xpLevel08
};

export const STREAK_ART = {
  streak_3: xpLevel06,
  streak_7: xpLevel08,
  streak_14: xpLevel10,
  streak_30: xpLevel12
};

export const BADGE_ART = {
  ...RANK_ART,
  ...STREAK_ART
};

const DEFAULT_ART = xpLevel01;

/**
 * Resolve the exact XP-level art key from a numeric level.
 * Levels above 12 use the level 12 final badge.
 * @param {number} level
 * @returns {string}
 */
export function tierFromLevel(level) {
  const n = Math.max(1, Math.min(12, Math.floor(Number(level || 1))));
  return `level_${String(n).padStart(2, "0")}`;
}

const KEYWORD_RULES = [
  { key: "champion", patterns: ["champion", "elite", "legend", "master", "grandmaster", "mythic"] },
  { key: "diamond", patterns: ["diamond", "crystal"] },
  { key: "platinum", patterns: ["platinum", "plat"] },
  { key: "gold", patterns: ["gold", "advanced", "expert"] },
  { key: "silver", patterns: ["silver", "intermediate", "warm up", "warmup"] },
  { key: "consistency", patterns: ["consistency", "consistent", "weekly", "habit", "dedication"] },
  { key: "strength", patterns: ["strength", "strong", "lift", "power", "muscle", "iron"] },
  { key: "cardio", patterns: ["cardio", "distance", "running", "run", "ride", "cycle", "swim", "endurance", "bolt", "heart"] },
  { key: "streak", patterns: ["streak"] },
  { key: "bronze", patterns: ["bronze", "beginner", "first", "starter", "rookie", "start"] }
];

function buildHaystack(badge) {
  if (!badge) return "";
  return [badge.code, badge.requirement, badge.requirementType, badge.type, badge.category, badge.name, badge.title, badge.icon]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Resolves the local image asset URL for a badge. Always returns a valid asset.
 * @param {object} badge backend badge/achievement object
 * @returns {string} importable image URL
 */
export function getBadgeAsset(badge) {
  if (!badge) return DEFAULT_ART;

  const levelValue = badge.level_number ?? badge.level;
  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const code = String(badge.code || "").toLowerCase();

  // Explicit numeric level / level_N code -> exact rank emblem.
  if (levelValue !== undefined && levelValue !== null && !Number.isNaN(Number(levelValue))) {
    return RANK_ART[tierFromLevel(levelValue)];
  }
  const levelCodeMatch = code.match(/^level[_-]?(\d+)$/);
  if (levelCodeMatch) {
    return RANK_ART[tierFromLevel(levelCodeMatch[1])];
  }
  if (requirementType === "level" && badge.value) {
    return RANK_ART[tierFromLevel(badge.value)];
  }

  // Streak thresholds now reuse the single XP-level image family.
  if (requirementType === "streak" || code.startsWith("streak") || /\bstreak\b/.test(String(badge.name || "").toLowerCase())) {
    const value = Number(badge.value ?? badge.requirementValue ?? NaN);
    if (!Number.isNaN(value)) {
      if (value >= 30) return xpLevel12;
      if (value >= 14) return xpLevel10;
      if (value >= 7) return xpLevel08;
      return xpLevel06;
    }
    return xpLevel06;
  }

  const haystack = buildHaystack(badge);
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => haystack.includes(p))) {
      return BADGE_ART[rule.key] || DEFAULT_ART;
    }
  }

  if (requirementType === "workout") return xpLevel07;

  return DEFAULT_ART;
}

export default getBadgeAsset;
