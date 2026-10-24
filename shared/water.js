// A transparent planning estimate, not an irrigation prescription.
export const EFFICIENCIES = {
  'Drip irrigation': 0.90, 'Micro-sprinklers': 0.85, 'Sprinklers': 0.75,
  'Furrow irrigation': 0.60, 'Flood irrigation': 0.55, 'Hand watering': 0.70, 'Rain-fed': null,
};
export const GALLONS_PER_ACRE_MM = 1069.066;
export function irrigationRuntime(gallons, measuredGallonsPerHour) {
  return Number.isFinite(gallons) && gallons >= 0 && Number.isFinite(measuredGallonsPerHour) && measuredGallonsPerHour > 0
    ? gallons / measuredGallonsPerHour : null;
}
export function waterBudget(days, acres, coefficient, efficiency) {
  if (!days?.length || ![acres, coefficient, efficiency].every(Number.isFinite) || !(acres > 0 && acres <= 10000) || !(coefficient > 0) || !(efficiency > 0 && efficiency <= 1)) return null;
  if (days.some(d => !Number.isFinite(d.et0) || !Number.isFinite(d.precipitation) || d.et0 < 0 || d.precipitation < 0)) return null;
  const rows = days.map(d => {
    const cropDemand = d.et0 * coefficient;
    const effectiveRain = d.precipitation * 0.8;
    const net = Math.max(0, cropDemand - effectiveRain);
    return { ...d, cropDemand, effectiveRain, net, gross: net / efficiency, gallons: net / efficiency * acres * GALLONS_PER_ACRE_MM };
  });
  return {
    rows,
    gross: rows.reduce((sum, d) => sum + d.gross, 0),
    gallons: rows.reduce((sum, d) => sum + d.gallons, 0),
    demand: rows.reduce((sum, d) => sum + d.cropDemand, 0),
    rain: rows.reduce((sum, d) => sum + d.effectiveRain, 0),
  };
}
