import * as t from 'tcomb';

const keyFormatRegex = /\d{4}-\d{2}-\d{2}/;
const hourFormatRegex = /\d{2}:\d{2}/;

function keyFormat(value) {
  return keyFormatRegex.test(value);
}
function hourFormat(value) {
  return hourFormatRegex.test(value);
}

const RestringedHourTime = t.refinement(t.String, hourFormat, 'RestringedHourTime');

const RestringedHour = t.struct({
  start: RestringedHourTime,
  end: RestringedHourTime,
  description: t.maybe(t.String)
}, 'RestringedHour');

const RestringedHourValue = t.list(RestringedHour, 'RestringedHourValue');
const RestringedHourKey = t.refinement(t.String, keyFormat, 'RestringedHourKey');

/**
 * @swagger
 * definitions:
 *   RestringedHour:
 *     properties:
 *       start:
 *         type: string
 *         format: "00:00"
 *       end:
 *         type: string
 *         format: "00:00"
 *       description:
 *         type: string
 *   RestringedHours:
 *     properties:
 *       "YYYY-MM-DD":
 *         type: array
 *         items:
 *           $ref: "#/definitions/RestringedHour"
 *   RestringedHoursResponse:
 *     properties:
 *       restringedHours:
 *         $ref: "#/definitions/RestringedHours"
 */
export const RestringedHourObject = t.refinement(t.Object, x => {
  Object.keys(x).forEach(x => RestringedHourKey(x));
  Object.values(x).forEach(x => RestringedHourValue(x));
  return true;
}, 'RestringedHourObject');

export const RestringedHours = t.struct({
  restringedHours: RestringedHourObject
}, 'RestringedHours');
