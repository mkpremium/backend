import { CallLogProps } from '../../models/call-log.model'
import { CallLogResponse } from '../../types/call-log-response.dto'
import { formatMiliseconds, normalizePhoneNumber } from '../../utils/call-service-utils'

export const transformCallLogResponseToCallLogProps = (callLogResponse:CallLogResponse) => {
  const custom = callLogResponse.call.call_analysis?.custom_analysis_data || {}
  const callAnalysis = callLogResponse.call.call_analysis || {}
  const metadata = callLogResponse.call.metadata || {}
  const buildingId = metadata.buildingId as string | undefined
  const ownerId = metadata.ownerId as string | undefined
  const contactId = metadata.contactId as string | undefined

  const callLogProps:CallLogProps = {
    duration: callLogResponse.call.duration_ms ? formatMiliseconds(callLogResponse.call.duration_ms) : '0',
    summary: callAnalysis.call_summary || undefined,
    toNumber: callLogResponse.call.to_number || undefined,
    transcript: callLogResponse.call.transcript || undefined,
    endReason: callLogResponse.call.disconnection_reason || undefined,
    recordingUrl: callLogResponse.call.recording_url || undefined,
    startTimestamp: callLogResponse.call.start_timestamp ? new Date(callLogResponse.call.start_timestamp) : undefined,
    callId: callLogResponse.call.call_id || undefined,
    interest: callAnalysis.user_sentiment || undefined,
    tipoVivienda: metadata.use || undefined,
    status: callLogResponse.call.call_status || undefined,
    ownerId: ownerId || undefined,
    cost: String((callLogResponse.call.call_cost?.combined_cost ?? 0) / 100) || '0',
    fromNumber: callLogResponse.call.from_number || undefined,
    fromNumberNorm: normalizePhoneNumber(callLogResponse.call.from_number ?? undefined),
    toNumberNorm: normalizePhoneNumber(callLogResponse.call.to_number ?? undefined),
    name: callLogResponse.call.agent_name || undefined,
    agentId: callLogResponse.call.agent_id || undefined,
    metadata,
    provincia: metadata.city || undefined,
    buildingId: buildingId || undefined,
    callSuccessful: callAnalysis.call_successful ?? undefined,
    vende: typeof custom.vende === 'boolean' ? custom.vende : undefined,
    resumen: typeof custom.resumen === 'string' ? custom.resumen : undefined,
    noLlamar: typeof custom.no_llamar === 'boolean' ? custom.no_llamar : undefined,
    rellamada: typeof custom.rellamada === 'string' ? custom.rellamada.toLowerCase() === 'si' : undefined,
    contactId: contactId || undefined,
    callQueueId: metadata.callQueueId || undefined
  }
  return callLogProps
}
