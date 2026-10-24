export function hasCoordinates(value) {
  return Number.isFinite(value?.latitude) && Number.isFinite(value?.longitude);
}

export function cropLabel(field) {
  return field?.crop === 'Other' ? field.customCrop || 'Other' : field?.crop || '';
}

export function locationLabel(value) {
  return hasCoordinates(value)
    ? `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
    : value?.address || 'Location not set';
}

export function locationKey(value) {
  return hasCoordinates(value)
    ? `coordinates:${value.latitude},${value.longitude}`
    : `address:${(value?.address || '').trim()}`;
}

export function weatherQuery(value) {
  const query = new URLSearchParams();
  if (hasCoordinates(value)) {
    query.set('latitude', String(value.latitude));
    query.set('longitude', String(value.longitude));
  } else query.set('address', (value?.address || '').trim());
  return query.toString();
}
