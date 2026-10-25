export function fieldDocument(field, id, createdAt = new Date().toISOString()) {
  const { customCrop, ...baseField } = field;
  return Object.fromEntries(Object.entries({
    ...baseField,
    ...(field.crop === 'Other' ? { customCrop } : {}),
    id,
    sample: false,
    createdAt: field.createdAt || createdAt,
  }).filter(([, value]) => value !== undefined));
}
