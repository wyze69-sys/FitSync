/**
 * Maps backend XP level data to local FitSync XP-level badge art.
 *
 * XP LEVEL emblems (./assets/badges/xp-levels/) -> 10 user-provided images,
 * one image per XP level. These assets are XP-level only; streak/category
 * achievements intentionally do not reuse them.
 *
 * This is a pure presentation helper. It does NOT change backend data: the
 * database `icon` field, badge codes, names and CRUD all stay intact.
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

const MAX_XP_BADGE_LEVEL = 10;

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
  level_10: xpLevel10
};

// Streak badge artwork is intentionally not implemented yet.
export const STREAK_ART = {
  streak_3: null,
  streak_7: null,
  streak_14: null,
  streak_30: null
};

export const BADGE_ART = {
  ...RANK_ART
};

/**
 * Resolve the exact XP-level art key from a numeric level.
 * Levels above 10 use the level 10 final badge.
 * @param {number} level
 * @returns {string}
 */
export function tierFromLevel(level) {
  const n = Math.max(1, Math.min(MAX_XP_BADGE_LEVEL, Math.floor(Number(level || 1))));
  return `level_${String(n).padStart(2, "0")}`;
}

function isLevelRequirement(requirementType) {
  return requirementType === "level" || requirementType === "xp_level" || requirementType === "rank";
}

/**
 * Resolves the local XP-level image asset URL for a badge.
 * Returns null for streak/category/workout achievements because XP art should
 * not be reused for those badge families.
 * @param {object} badge backend badge/achievement object
 * @returns {string|null} importable image URL for XP levels, otherwise null
 */
export function getBadgeAsset(badge) {
  if (!badge) return null;

  const levelValue = badge.level_number ?? badge.level;
  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const code = String(badge.code || "").toLowerCase();

  // Explicit numeric level / level_N code -> exact XP-level emblem.
  if (levelValue !== undefined && levelValue !== null && !Number.isNaN(Number(levelValue))) {
    return RANK_ART[tierFromLevel(levelValue)];
  }

  const levelCodeMatch = code.match(/^level[_-]?(\d+)$/);
  if (levelCodeMatch) {
    return RANK_ART[tierFromLevel(levelCodeMatch[1])];
  }

  if (isLevelRequirement(requirementType) && badge.value) {
    return RANK_ART[tierFromLevel(badge.value)];
  }

  return null;
}

export default getBadgeAsset;
