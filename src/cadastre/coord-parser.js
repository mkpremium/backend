import Utm from 'utm-latlng';

const SRS = {
  'EPSG:32627': 'WGS 84',
  'EPSG:32628': 'WGS 84',
  'EPSG:32629': 'WGS 84',
  'EPSG:32630': 'WGS 84',
  'EPSG:32631': 'WGS 84',
  'EPSG:25829': 'ETRS89',
  'EPSG:25830': 'ETRS89',
  'EPSG:25831': 'ETRS89',
  'EPSG:23029': 'ED50',
  'EPSG:23030': 'ED50',
  'EPSG:23031': 'ED50'
};
const ZONE_NUM = {
  'EPSG:32627': 27,
  'EPSG:32628': 28,
  'EPSG:32629': 29,
  'EPSG:32630': 30,
  'EPSG:32631': 31,
  'EPSG:25829': 29,
  'EPSG:25830': 30,
  'EPSG:25831': 31,
  'EPSG:23029': 29,
  'EPSG:23030': 30,
  'EPSG:23031': 31
};

export function parseCoords({srs, xcen, ycen}) {
  const utm = new Utm(SRS[srs]);
  return utm.convertUtmToLatLng(xcen, ycen, ZONE_NUM[srs], 'N');
}
