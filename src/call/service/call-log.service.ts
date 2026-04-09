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

export class CallLogService {
  constructor (
       private logger: ReturnType<typeof initLogger>,
       private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService,
       private callLogRepository: PostgresCallLogRepository
  ) {}

  async saveCallLog (body:CallLogResponse) {
    const callLogProps:CallLogProps = transformCallLogResponseToCallLogProps(body)
    const buildingId = callLogProps.buildingId
    const ownerId = callLogProps.ownerId
    const contactId = callLogProps.contactId
    const resumen = callLogProps.resumen
    const recordingUrl = callLogProps.recordingUrl

    if (buildingId && ownerId && contactId) {
      if (callLogProps.vende) {
        try {
          await this.changeNegotiationStatus(buildingId)
          if (resumen && recordingUrl) {
            const notesParams = [callLogProps.resumen!, callLogProps.recordingUrl!]
            await this.saveBuildingNotes(buildingId, notesParams)
          }
        } catch (error) {
          console.log('Error changing negotiation status', error)
          throw error
        }
      }
    }

    await this.callLogRepository.save(callLogProps)
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
}
