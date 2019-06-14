import * as t from 'tcomb';

const Positive = t.refinement(t.Number, n => n >= 0, 'Positive');

/**
 * @swagger
 * definitions:
 *   MeetingRestrictions:
 *     properties:
 *       enable:
 *         type: boolean
 *       meetingTime:
 *         type: number
 *         description: Entero positivo
 *       timeBetweenMeeting:
 *         type: number
 *       allowedStartMinutes:
 *         type: array
 *         items:
 *           type: number
 *         description: Listado de enteros positivos
 */
export const MeetingRestrictions = t.struct({
  enable: t.Boolean,
  meetingTime: Positive,
  timeBetweenMeeting: Positive,
  allowedStartMinutes: t.list(Positive)
}, 'MeetingRestrictions');

export const FreezerSettings = t.struct({
  enable: t.Boolean,
  daysInFreezer: Positive,
  provinces: t.list(t.String)
}, 'FreezerSettings');

/**
 * @swagger
 * definitions:
 *   SystemPreferences:
 *     properties:
 *       maintenanceModeEnabled:
 *         type: boolean
 *         description: Reservado para uso futuro
 *       meetingRestrictions:
 *         $ref: "#/definitions/MeetingRestrictions"
 */
export const SystemPreferences = t.struct(
  {
    id: t.String,
    maintenanceModeEnabled: t.Boolean,
    meetingRestrictions: MeetingRestrictions,
    freezer: FreezerSettings,
    _documentType: t.enums.of(['system-preferences'])
  },
  {
    name: 'SystemPreferences',
    defaultProps: {
      id: 'system-preferences',
      maintenanceModeEnabled: false,
      meetingRestrictions: {
        enable: true,
        meetingTime: 1,
        timeBetweenMeeting: 0.5,
        allowedStartMinutes: [0, 30]
      },
      freezer: {
        enable: true,
        daysInFreezer: 90,
        provinces: []
      },
      _documentType: 'system-preferences'
    }
  }
);

SystemPreferences.prototype.setMaintenanceMode = function(enabled) {
  return t.update(this, {maintenanceModeEnabled: {$set: enabled}});
};
