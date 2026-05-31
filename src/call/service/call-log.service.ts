import { AppDataSource } from '../../data-source'
import { CallLogResponse } from '../types/call-log-response.dto'
import { initLogger } from '../../infrastructure/logger'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { BuildingNegotiationStatus } from '../../building/building'
import { PostgresBuildingNotesRepository } from '../../building/repository/postgres-building-notes.repository'
import { CreateNoteCommand } from '../../notes/types'
import { transformCallLogResponseToCallLogProps } from './mappers/call-log-response-to-call-log-props.mapper'
import { CallLogProps, UmindCallLog } from '../models/call-log.model'
import { PostgresCallLogRepository } from '../repository/postgres-call-log.repository'
import { transformCallLogPropsToUmindCallLog } from './mappers/call-log-props to umind-call-log.mapper'
import axios from 'axios'
import { PostgresCallQueueRepository } from '../repository/postgres-call-queue.repository'
import { CallEvent, callEmitter } from '../events/call-events'
import { discardedCallReasons } from '../infrastructure/retell/types/retell-end-reason-and-status'

export class CallLogService {
  constructor (
       private logger: ReturnType<typeof initLogger>,
       private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
       private callLogRepository: PostgresCallLogRepository,
       private callQueueRepository: PostgresCallQueueRepository
  ) {}

  async saveCallLog (body:CallLogResponse) {
    const callLogProps:CallLogProps = transformCallLogResponseToCallLogProps(body)

    await this.callLogRepository.save(callLogProps)
    if (callLogProps.callQueueId) {
      await this.checkCallLog(callLogProps)
    }
    callEmitter.emit(CallEvent.CALL_COMPLETED,
      {
        city: callLogProps.provincia!,
        buildingId: callLogProps.buildingId,
        callQueueId: callLogProps.callQueueId,
        calledAt: callLogProps.startTimestamp,
        vende: callLogProps.vende,
        status: callLogProps.status,
        noLlamar: callLogProps.noLlamar,
        rellamada: callLogProps.rellamada
      })

    const uMindCallLog: UmindCallLog = transformCallLogPropsToUmindCallLog(callLogProps)
    await this.sendCallLogToUmind(uMindCallLog)
  }

  async saveBuildingNotes (buildingId:string, notesParams:string[]) {
    if (!buildingId) return
    const buildingNoteRepo = new PostgresBuildingNotesRepository(AppDataSource)
    const userId = '56ecc194-b998-43b5-a118-62e40b69aa84'

    for (const elem of notesParams) {
      if (!elem) continue
      const note = `${elem}`
      const newNote:CreateNoteCommand = {
        note,
        context: { buildingId }
      }
      await buildingNoteRepo.createNote(newNote, userId)
    }
  }

  async changeNegotiationStatus (buildingId:string) {
    const flipperId = '24113328-ed9d-4ca6-919d-630b2cd05062'
    const userId = '56ecc194-b998-43b5-a118-62e40b69aa84'
    const status:BuildingNegotiationStatus = 'PENDIENTE'
    const params = {
      status,
      userId,
      flipperId
    }
    await this.updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, params)
  }

  async sendCallLogToUmind (callLog:UmindCallLog) {
    try {
      await axios.post(process.env.UMINDS_URL!, callLog, { headers: { 'Content-Type': 'application/json' } })
      console.info('Call log enviado a Umind correctamente')
    } catch (err:any) {
      console.warn('Error enviando Call Log a Umind:', err?.message || err)
    }
  }

  async checkCallLog (callLog:CallLogProps) {
    this.logger.info(
      `[checkCallLog] callQueueId=${callLog.callQueueId} status=${callLog.status} vende=${callLog.vende} noLlamar=${callLog.noLlamar}`
    )
    const endReason = callLog.endReason
    if (callLog.rellamada === true) {
      this.logger.info(`[checkCallLog] Rellamada detected. Keeping callQueueId=${callLog.callQueueId} in current state`)
      return
    }
    if (callLog.status === 'not_connected' || callLog.status === 'not connected') {
      if (endReason && discardedCallReasons.includes(endReason)) {
        this.logger.info(`[checkCallLog] not_connected and discardedCallReasons -callQueueId=${callLog.callQueueId} endReason=${endReason}`)
        await this.contactDiscarded(callLog)
        return
      }
      this.logger.info(`[checkCallLog] not_connected and NoAnswer -callQueueId=${callLog.callQueueId} endReason=${endReason}`)
      await this.contactNoAnswer(callLog)
      return
    }
    if (callLog.noLlamar === true) {
      this.logger.info(`[checkCallLog] This contact DONT_NOT_CALL -callQueueId=${callLog.callQueueId} endReason=${endReason}`)
      await this.contactDoNotCall(callLog)
      return
    }
    if (callLog.vende === true) {
      this.logger.info(`[checkCallLog] This contact SALE -callQueueId=${callLog.callQueueId} endReason=${endReason}`)
      await this.contactSale(callLog)
      return
    }
    if (callLog.vende === false) {
      this.logger.info(`[checkCallLog] This contact NO_SALE -callQueueId=${callLog.callQueueId} endReason=${endReason}`)
      await this.contactNoSale(callLog)
      return
    }
    this.logger.info(`[checkCallLog] No handler matched for callQueueId=${callLog.callQueueId} status=${callLog.status}`)
  }

  async contactSale (callLogProps:CallLogProps) {
    const resumen = `Teléfono: ${callLogProps.toNumberNorm} \n\nResumen:${callLogProps.resumen}`
    const buildingId = callLogProps.buildingId!
    const callQueueId = callLogProps.callQueueId!
    const recordingUrl = callLogProps.recordingUrl
    const calledAt = callLogProps.startTimestamp!
    try {
      await this.changeNegotiationStatus(buildingId)
      if (resumen && recordingUrl) {
        const notesParams = [callLogProps.resumen!, callLogProps.recordingUrl!]
        await this.saveBuildingNotes(buildingId, notesParams)
      }
      await this.callQueueRepository.freezeSale(calledAt, callQueueId)
      await this.callQueueRepository.changeAllBuildingSaleContactStatus(buildingId)
    } catch (error) {
      console.log('Error changing negotiation status', error)
      throw error
    }
  }

  async contactDoNotCall (callLogProps:CallLogProps) {
    const calledAt = callLogProps.startTimestamp!
    const callQueueId = callLogProps.callQueueId!
    try {
      await this.callQueueRepository.freezeDoNotCall(calledAt, callQueueId)
    } catch (error) {
      console.log('Error changing contact status', error)
    }
  }

  async contactNoSale (callLogProps:CallLogProps) {
    const calledAt = callLogProps.startTimestamp!
    const callQueueId = callLogProps.callQueueId!
    try {
      this.logger.info(`[contactNoSale] callQueueId=${callQueueId}`)
      await this.callQueueRepository.freezeNoSale(calledAt, callQueueId)
    } catch (error) {
      console.log('Error changing contact status', error)
    }
  }

  async contactNoAnswer (callLogProps:CallLogProps) {
    const calledAt = callLogProps.startTimestamp!
    const callQueueId = callLogProps.callQueueId!
    const maxAttempts = 5
    try {
      const callCount = await this.callQueueRepository.getCallCount(callQueueId)
      if (callCount === null) {
        this.logger.error(`Call queue not found for id ${callQueueId}`)
        return
      }
      if (callCount + 1 >= maxAttempts) {
        await this.callQueueRepository.freezeNoAnswer(calledAt, callQueueId)
        return
      }
      await this.callQueueRepository.markNoAnswer(calledAt, callQueueId)
    } catch (error) {
      console.log('Error changing contact status', error)
    }
  }

  async contactDiscarded (callLogProps:CallLogProps) {
    const calledAt = callLogProps.startTimestamp!
    const callQueueId = callLogProps.callQueueId!
    try {
      this.logger.info(`[contactDiscarded] callQueueId=${callQueueId}`)
      await this.callQueueRepository.markAsDiscarded(calledAt, callQueueId)
    } catch (error) {
      console.log('Error discarding invalid contact', error)
    }
  }
}
