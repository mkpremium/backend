import t from 'tcomb';
import uuid from 'uuid/v4';

export const OperatorActions = {
  CALL: 'call',
  CALL_ANSWERED: 'call_answered',
  VERIFIED_OWNER: 'verified_owner',
  MEETING: 'meeting',
  SCHEDULE_CALL: 'schedule_call',
  VIEW_WORKSHEET: 'view_worksheet'
};

t.OperatorActions = t.enums.of(Object.values(OperatorActions));

t.OperatorStats = t.struct(
  {
    id: t.String,
    operatorId: t.String,
    action: t.OperatorActions,
    createdAt: t.Date,

    _documentType: t.enums.of(['operator-stats'])
  },
  {
    name: 'OperatorStats',
    defaultProps: {
      get id() {
        return uuid();
      },
      get createdAt() {
        return new Date();
      },
      _documentType: 'operator-stats'
    }
  }
);

/**
 * @swagger
 * definitions:
 *   OperatorResultCounters:
 *     properties:
 *       callsMade:
 *         type: number
 *         description: Cantidad de llamadas realizadas
 *       callsAnswered:
 *         type: number
 *         description: Cantidad de llamadas recibidas
 *       verifiedOwners:
 *         type: number
 *         description: Cantidad de propietarios verificados
 *       meetingsMade:
 *         type: number
 *         description: Cantidad de citas realizadas
 *   OperatorResults:
 *     properties:
 *       operator:
 *         $ref: "#/definitions/Operator"
 *       onLine:
 *         type: boolean
 *         description: Indica si el operator esta en linea (conectado al socket)
 *       counters:
 *         $ref: "#/definitions/OperatorResultCounters"
 *
 */
t.OperatorResults = t.struct(
  {
    operator: t.Operator,
    onLine: t.Boolean,
    counters: t.struct({
      callsMade: t.Number,
      callsAnswered: t.Number,
      verifiedOwners: t.Number,
      meetingsMade: t.Number
    }, 'counters')
  },
  {
    name: 'OperatorStats',
    defaultProps: {
      onLine: false
    }
  }
);

export default t;
