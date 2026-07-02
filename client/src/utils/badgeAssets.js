/**
 * Maps backend badge/achievement data to local FitSync badge art.
 *
 * Two visually distinct families:
 *   - XP RANK emblems  (./assets/badges/rhosgfx-ranks/) -> downloaded RhosGFX
 *     "Vector Ranks" CC0 art (see rhosgfx-ranks/README.md and
 *     LICENSE-RhosGFX-Vector-Ranks.txt). This is the single source of truth for
 *     XP/level rank badges.
 *   - STREAK / category medals (./assets/badges/custom/) -> circular flame medals,
 *     each streak tier visually unique. Original FitSync art.
 *
 * This is a pure presentation helper. It does NOT change backend data: the
 * database `icon` (emoji) field, badge codes, names and CRUD all stay intact.
 *
 * Matching priority (most specific first):
 *   1. streak badge code / streak requirement value  -> unique streak medal
 *   2. explicit numeric level / level_N code          -> rank tier emblem
 *   3. keyword match across code/type/name/icon
 *   4. requirement-type fallback
 *   5. safe default (bronze rank)
 */

// XP rank emblems (downloaded RhosGFX CC0 "Vector Ranks").
import xpRankBronze from "../assets/badges/rhosgfx-ranks/xp-rank-bronze.svg";
import xpRankSilver from "../assets/badges/rhosgfx-ranks/xp-rank-silver.svg";
import xpRankGold from "../assets/badges/rhosgfx-ranks/xp-rank-gold.svg";
import xpRankPlatinum from "../assets/badges/rhosgfx-ranks/xp-rank-platinum.svg";
import xpRankDiamond from "../assets/badges/rhosgfx-ranks/xp-rank-diamond.svg";
import xpRankChampion from "../assets/badges/rhosgfx-ranks/xp-rank-champion.svg";

// Streak medals (circular flame family) — each tier is unique.
import streak3 from "../assets/badges/custom/streak-3.svg";
import streak7 from "../assets/badges/custom/streak-7.svg";
import streak14 from "../assets/badges/custom/streak-14.svg";
import streak30 from "../assets/badges/custom/streak-30.svg";

// Category medals.
import strengthMedal from "../assets/badges/custom/strength-medal.svg";
import cardioBolt from "../assets/badges/custom/cardio-bolt.svg";
import consistencyCrown from "../assets/badges/custom/consistency-crown.svg";

export const RANK_ART = {
  bronze: xpRankBronze,
  silver: xpRankSilver,
  gold: xpRankGold,
  platinum: xpRankPlatinum,
  diamond: xpRankDiamond,
  champion: xpRankChampion
};

export const STREAK_ART = {
  streak_3: streak3,
  streak_7: streak7,
  streak_14: streak14,
  streak_30: streak30
};

export const BADGE_ART = {
  ...RANK_ART,
  streak3,
  streak7,
  streak14,
  streak30,
  strength: strengthMedal,
  cardio: cardioBolt,
  consistency: consistencyCrown
};

const DEFAULT_ART = xpRankBronze;

/**
 * Resolve a rank-tier art key from a numeric level.
 * level 1 -> bronze, 2 -> silver, 3 -> gold, 4 -> platinum, 5-6 -> diamond, 7+ -> champion.
 * @param {number} level
 * @returns {string}
 */
export function tierFromLevel(level) {
  const n = Number(level || 0);
  if (n >= 7) return "champion";
  if (n >= 5) return "diamond";
  if (n >= 4) return "platinum";
  if (n >= 3) return "gold";
  if (n >= 2) return "silver";
  return "bronze";
}

/**
 * Picks the unique streak medal for a streak badge, by code first then by the
 * nearest requirement threshold (3/7/14/30). Returns an asset URL or null.
 * @param {object} badge
 * @returns {string|null}
 */
function resolveStreakArt(badge) {
  const code = String(badge.code || "").toLowerCase();
  if (STREAK_ART[code]) return STREAK_ART[code];

  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const isStreak = requirementType === "streak" || code.startsWith("streak") || /\bstreak\b/.test(String(badge.name || "").toLowerCase());
  if (!isStreak) return null;

  const value = Number(badge.value ?? badge.requirementValue ?? NaN);
  if (!Number.isNaN(value)) {
    if (value >= 30) return streak30;
    if (value >= 14) return streak14;
    if (value >= 7) return streak7;
    return streak3;
  }
  return streak7;
}

const KEYWORD_RULES = [
  { key: "champion", patterns: ["champion", "elite", "legend", "master", "grandmaster"] },
  { key: "diamond", patterns: ["diamond", "crystal"] },
  { key: "platinum", patterns: ["platinum", "plat"] },
  { key: "gold", patterns: ["gold", "advanced", "expert"] },
  { key: "silver", patterns: ["silver", "intermediate", "warm up", "warmup"] },
  { key: "consistency", patterns: ["consistency", "consistent", "weekly", "habit", "dedication"] },
  { key: "strength", patterns: ["strength", "strong", "lift", "power", "muscle", "iron"] },
  { key: "cardio", patterns: ["cardio", "distance", "running", "run", "ride", "cycle", "swim", "endurance", "bolt", "heart"] },
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
 * Resolves the local SVG asset URL for a badge. Always returns a valid asset.
 * @param {object} badge backend badge/achievement object
 * @returns {string} importable SVG URL
 */
export function getBadgeAsset(badge) {
  if (!badge) return DEFAULT_ART;

  // 1. Streak badges get unique streak medals.
  const streakArt = resolveStreakArt(badge);
  if (streakArt) return streakArt;

  // 2. Explicit numeric level / level_N code -> rank emblem.
  const levelValue = badge.level_number ?? badge.level;
  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const code = String(badge.code || "").toLowerCase();
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

  // 3. Keyword matching.
  const haystack = buildHaystack(badge);
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => haystack.includes(p))) {
      return BADGE_ART[rule.key] || DEFAULT_ART;
    }
  }

  // 4. Requirement-type fallback.
  if (requirementType === "workout") return strengthMedal;

  return DEFAULT_ART;
}

export default getBadgeAsset;
