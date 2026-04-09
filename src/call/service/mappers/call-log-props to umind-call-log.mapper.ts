import { CallLogProps, UmindCallLog } from '../../models/call-log.model'

export const transformCallLogPropsToUmindCallLog = (callLogProps:CallLogProps) => {
  const umindCallLog:UmindCallLog = {
    client_id: process.env.UMINDS_CLIENT_ID!,
    call_id: callLogProps.callId!,
    from_number: callLogProps.fromNumber,
    to_number: callLogProps.toNumber,
    duration: callLogProps.duration,
    status: callLogProps.status,
    transcript: callLogProps.transcript,
    summary: callLogProps.summary,
    recordings: callLogProps.recordingUrl,
    end_reason: callLogProps.endReason,
    interest: callLogProps.interest,
    tipo_vivienda: callLogProps.tipoVivienda,
    cost: callLogProps.cost,
    metadata: callLogProps.metadata
  }
  return umindCallLog
}
