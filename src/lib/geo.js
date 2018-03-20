import _get from 'lodash/get';
import geo from 'geolib';

function parseLatLong(obj) {
  const latitude = obj.lat || null;
  const longitude = obj.long || obj.lng || null;
  if (!latitude || !longitude) {
    return null;
  }

  return {latitude, longitude};
}

export function buildDistanceCalculator(location, from) {
  return (obj) => {
    const objLocation = parseLatLong(_get(obj, from));
    const refLocation = parseLatLong(location);

    if (!refLocation || !objLocation) {
      return 0;
    }

    return geo.getDistance(refLocation, objLocation);
  };
}
