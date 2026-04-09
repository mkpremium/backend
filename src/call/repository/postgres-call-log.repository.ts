import { DeepPartial, Repository } from 'typeorm'
import { CallLog } from '../call-log.entity'
import { AppDataSource } from '../../data-source'
import { CallLogProps } from '../models/call-log.model'

export class PostgresCallLogRepository {
   private callLogRepository: Repository<CallLog>

   constructor () {
     this.callLogRepository = AppDataSource.getRepository(CallLog)
   }

   async save (callLogProps:CallLogProps): Promise<void> {
     const newCallLog = await this.callLogRepository.create(this.structToEntity(callLogProps))
     await this.callLogRepository.save(newCallLog)
   }

   protected structToEntity (callLog:CallLogProps):DeepPartial<CallLog> {
     return {
       startTime: callLog.startTimestamp,
       duration: callLog.duration,
       toNumber: callLog.toNumber,
       summary: callLog.summary,
       transcript: callLog.transcript,
       endReason: callLog.endReason,
       recordings: callLog.recordingUrl,
       callId: callLog.callId,
       interest: callLog.interest,
       tipoVivienda: callLog.tipoVivienda,
       status: callLog.status,
       ownerId: callLog.ownerId,
       cost: callLog.cost,
       fromNumber: callLog.fromNumber,
       fromNumberNorm: callLog.fromNumberNorm,
       toNumberNorm: callLog.toNumberNorm,
       name: callLog.name,
       agentId: callLog.agentId,
       metadata: callLog.metadata,
       provincia: callLog.provincia,
       buildingId: callLog.buildingId,
       contactId: callLog.contactId,
       resumen: callLog.resumen,
       callSuccessful: callLog.callSuccessful,
       vende: callLog.vende,
       noLlamar: callLog.noLlamar,
       rellamada: callLog.rellamada,
       callQueueId: callLog.callQueueId
     }
   }
}
