export function locationPointView({location}) {
  return {
    Gps_Lat: location.lat,
    Gps_Lon: location.lng
  };
}
