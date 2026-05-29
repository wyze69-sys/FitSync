/**
 * Calculate Body Mass Index (BMI) from weight and height.
 * @param {number} weightKg - Body weight in kilograms.
 * @param {number} heightCm - Body height in centimeters.
 * @returns {number} BMI value rounded to 1 decimal place.
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return 0;
  }
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

module.exports = { calculateBMI };
