/**
 * Client-side body-metric helpers. The authoritative BMI value is computed and
 * stored server-side; these helpers are for live UI display only.
 */

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

/**
 * Map a BMI value to a display category with valid Tailwind colour tokens.
 */
export function resolveBmiCategory(bmi) {
  if (!bmi || bmi <= 0) {
    return {
      label: "Not calculated",
      description: "Add your height and weight to calculate BMI.",
      colorClass: "text-muted",
      barClass: "bg-border",
      badgeClass: "bg-bg text-muted border border-border"
    };
  }
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      description: "Below the standard healthy range.",
      colorClass: "text-amber-400",
      barClass: "bg-amber-400",
      badgeClass: "bg-amber-950/20 text-amber-400 border border-amber-900/30"
    };
  }
  if (bmi < 25) {
    return {
      label: "Healthy Weight",
      description: "Within the standard healthy range.",
      colorClass: "text-accent",
      barClass: "bg-accent",
      badgeClass: "bg-accent/10 text-accent border border-accent/30"
    };
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      description: "Above the standard healthy range.",
      colorClass: "text-orange-400",
      barClass: "bg-orange-400",
      badgeClass: "bg-orange-950/20 text-orange-400 border border-orange-900/30"
    };
  }
  return {
    label: "Obese",
    description: "Well above the standard healthy range.",
    colorClass: "text-rose-500",
    barClass: "bg-rose-500",
    badgeClass: "bg-rose-950/20 text-rose-400 border border-rose-900/30"
  };
}
