import _get from 'lodash/get'
import _set from 'lodash/set'
import geo from 'geolib'

function parseLatLong (obj) {
  const latitude = obj.lat || null
  const longitude = obj.long || obj.lng || null
  if (!latitude || !longitude) {
    return null
  }

  return { latitude, longitude }
}

export function buildDistanceCalculator (location, from) {
  return (obj) => {
    const objLocation = parseLatLong(_get(obj, from))
    const refLocation = parseLatLong(location)

    if (!refLocation || !objLocation) {
      return obj
    }

    const json = JSON.parse(JSON.stringify(obj))
    _set(json, 'event.distance', geo.getDistance(refLocation, objLocation))

    return json
  }
}
