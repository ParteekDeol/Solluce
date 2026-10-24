const dateFor = (offset) => {
  const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offset);
  return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
};
export const sampleField = {
  id: 'sample-tomatoes', name: 'Valley tomato plot', crop: 'Tomatoes', soil: 'Sandy loam',
  irrigation: 'Drip irrigation', stage: 'Fruit development', acres: 2.5, address: 'Manteca, CA',
  sample: true,
};
export const sampleWeather = {
  sample: true, source: 'Illustrative forecast', fetchedAt: new Date().toISOString(),
  location: { name: 'Manteca, California', latitude: 37.7974, longitude: -121.216, precision: 'city' },
  current: { temperature: 76, humidity: 42, wind: 6, code: 1 },
  days: [76,78,81,79,73,71,74].map((high, i) => ({
    date: dateFor(i), high, low: [52,53,54,54,51,49,50][i],
    precipitation: [0,0,0,0,2,4,0][i], rainChance: [0,0,5,10,35,65,10][i],
    et0: [3.4,3.6,3.9,3.5,2.9,2.5,3.1][i], sunshineHours: [9.5,9.7,10,8,6,4,8][i],
    wind: [6,7,5,9,11,8,6][i], code: [1,0,0,2,3,61,2][i],
  })),
};
export const sampleAnalysis = {
  id: 'sample-analysis', createdAt: new Date().toISOString(), sample: true,
  field: sampleField, quality: 'Some concerns',
  concerns: 'Lower leaves are yellowing and a few plants wilt in the afternoon. The drip line was last checked two weeks ago.',
  location: sampleWeather.location, photoCount: 0, model: 'Illustrative example',
  weather: sampleWeather, weatherWarning: null, completed: [],
  report: {
    headline: 'Start at the roots. Look closer at the water.',
    summary: 'In this example, a grower reports yellowing lower leaves and afternoon wilting. Checking moisture and drip uniformity is the first useful step before treating for disease or nutrient deficiency.',
    imageQuality: 'limited',
    imageNotes: 'This is a written demonstration, not an analysis of an uploaded photograph.',
    overallStatus: 'attention',
    observations: ['Grower reports yellowing on lower leaves.', 'Afternoon wilting is reported on some plants.', 'The irrigation line has not been checked in two weeks.'],
    issues: [
      { title: 'Uneven water delivery', confidence: 'moderate', severity: 'moderate', evidence: 'Patchy wilting could be consistent with uneven drip delivery, based on the example grower description.', alternatives: 'Heat, root disease, salinity or prolonged saturation can also produce wilting.', verification: 'Compare root-zone moisture at healthy and affected plants. Catch and compare emitter output for the same interval at the start, middle and end of a line.' },
      { title: 'Lower-leaf yellowing', confidence: 'low', severity: 'low', evidence: 'The example grower reports yellowing older leaves; there is no leaf photograph or nutrient test.', alternatives: 'Normal leaf aging, nitrogen shortage, water stress and root problems can look similar.', verification: 'Inspect the yellowing pattern, leaf undersides and roots. If it spreads, request a tissue or soil test before applying fertilizer.' },
    ],
    recommendations: [
      { title: 'Check moisture before watering', priority: 'today', action: 'Compare soil moisture in the active root zone at three affected and three healthy plants. Record whether the soil is dry, moist or saturated.', why: 'Wilting can occur with both too little and too much water. A root-zone check helps distinguish them.', category: 'water' },
      { title: 'Give your drip line a quick check', priority: 'today', action: 'Walk the line for leaks and blocked emitters. Compare output at the start, middle and end before changing irrigation timing.', why: 'Uneven delivery can leave adjacent plants under- or over-watered.', category: 'inspection' },
      { title: 'Track the lower leaves', priority: 'this_week', action: 'Photograph the same tagged plants in consistent light over the next few days. Note new symptoms and whether yellowing moves upward.', why: 'A repeatable record helps an adviser distinguish ongoing stress from normal leaf aging.', category: 'crop' },
    ],
    timeline: [
      { when: 'Today', title: 'Check before you change', action: 'Inspect root-zone moisture and compare emitter output. Tag three plants for follow-up.', checkpoint: 'Record moisture observations and emitter differences.' },
      { when: 'In 2–3 days', title: 'Look for a pattern', action: 'Check the tagged plants at the same time each day. Photograph the same lower leaves.', checkpoint: 'Is wilting temporary, persistent or spreading?' },
      { when: 'In 7 days', title: 'Reassess with evidence', action: 'Compare notes and photos. If symptoms persist, contact UC Cooperative Extension or a crop adviser.', checkpoint: 'Review new growth and symptom spread; do not assume recovery.' },
    ],
    irrigationAdvice: 'Use the weather budget as a starting estimate. Confirm root-zone moisture, crop coefficient and actual system flow before setting duration. Pause and reassess after rain.',
    limitations: ['This sample is not an actual crop diagnosis.', 'No soil, tissue or irrigation-flow measurements are available.', 'Forecast estimates do not measure moisture in your field.'],
  },
};
