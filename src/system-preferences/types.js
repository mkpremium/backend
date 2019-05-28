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
    maintenanceModeEnabled: t.Boolean,
    meetingRestrictions: MeetingRestrictions,
    _documentType: t.enums.of(['system-preferences'])
  },
  {
    name: 'SystemPreferences',
    defaultProps: {
      maintenanceModeEnabled: false,
      meetingRestrictions: {
        enabled: true,
        meetingTime: 0.5,
        timeBetweenMeeting: 0,
        allowedStartMinutes: [0, 30]
      },
      _documentType: 'system-preferences'
    }
  }
);
