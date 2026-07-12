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

// Kept for compatibility with existing imports; non-XP badges use text fallbacks below.
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

function initialsFrom(value) {
  const words = String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);

  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

/**
 * Returns a compact text/symbol fallback for achievements without image art.
 * Admin-provided symbols take priority, followed by a stable streak or name emblem.
 * @param {object} badge
 * @returns {string}
 */
export function getBadgeFallback(badge) {
  if (!badge) return "AC";

  const configuredIcon = String(badge.icon || "").trim();
  if (configuredIcon) {
    return Array.from(configuredIcon).slice(0, 3).join("");
  }

  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const code = String(badge.code || "").toLowerCase();
  if (requirementType === "streak" || code.startsWith("streak_")) {
    return "ST";
  }

  return initialsFrom(badge.name) || initialsFrom(badge.code) || "AC";
}

export function getBadgeAsset(badge) {
  if (!badge) return null;

  const code = String(badge.code || "").toLowerCase();
  const requirementType = String(badge.requirement || badge.requirementType || "").toLowerCase();
  const levelValue = badge.level_number ?? badge.level;

  // If the badge represents a specific system badge from DB/endpoints
  // (which has a non-empty code or requirementType), it MUST be an XP level to use XP art.
  const hasCodeOrReq = !!(badge.code || badge.requirement || badge.requirementType);
  if (hasCodeOrReq) {
    const isXP = code.match(/^level[_-]?\d+$/) || isLevelRequirement(requirementType);
    if (!isXP) {
      return null;
    }
  }

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
