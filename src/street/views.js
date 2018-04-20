import GeoJSON from 'geojson';

export function locationPointView({location}) {
  return {
    Gps_Lat: location.lat,
    Gps_Lon: location.lng
  };
}

function flatLocation(struct) {
  const {lat, lng} = struct.location;
  const data = JSON.parse(JSON.stringify(struct));

  return Object.assign({}, data, {lat, lng});
}

export function toGeoJSON(results) {
  return GeoJSON.parse(results.map(flatLocation), {Point: ['lat', 'lng']});
}
