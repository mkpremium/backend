import { ContactService } from './contact-service'
import { initLogger } from '../../infrastructure/logger'
import { ContactDTO } from '../types/contact-dto'
import { Task } from '../types/task-call'
import { CityCallRequest, CityCallResponse } from '../types/call-batch-request-dto'
import { ScheduledTask } from 'node-cron'
import { AppDataSource } from '../../data-source'
import { CallSchedule } from '../call-schedule.entity'
import Retell from 'retell-sdk'
import { DateTime } from 'luxon'
import { CallLogResponse, RetellCustomFunctionResponse, UmindCallLog } from '../types/call-log-response.dto'
import { CallLog } from '../call-log.entity'
import { DeepPartial } from 'typeorm'
import { CallQueue } from '../call-queue.entity'
import { BatchCallCreateBatchCallParams } from 'retell-sdk/resources/batch-call.mjs'
import moment from 'moment-timezone'
import { UpdateBuildingNegotiationStatusService } from '../../building/service/update-building-negotiation-status.service'
import { BuildingNegotiationStatus } from '../../building/building'
import { PostgresBuildingNotesRepository } from '../../building/repository/postgres-building-notes.repository'
import { CreateNoteCommand } from '../../notes/types'

export class CallService {
    private scheduleTask: ScheduledTask | null = null
    private callScheduleRepo = AppDataSource.getRepository(CallSchedule)

    constructor (
      private contactService: ContactService,
      private retellClient: Retell,
      private logger: ReturnType<typeof initLogger>,
      private updateBuildingNegotiationStatusService: UpdateBuildingNegotiationStatusService
    ) {}

    async makeBatchCall (request:CityCallRequest) {
      const result: CityCallResponse = {
        city: request.city!,
        status: 'ok',
        message: ''
      }
      try {
        const temporalContacts = await this.contactService.getCityContacts(request.city!, request.limit!)
        if (!temporalContacts) {
          result.status = 'error'
          result.message = 'No quedan contactos sin llamar'
          return result
        }
        this.logger.info(JSON.stringify(temporalContacts, null, 2))
        const tasks:Task[] = this.transformContactstoBatchCallTask(temporalContacts)
        this.logger.info(JSON.stringify(tasks, null, 2))

        const timeWindow = {
          startTime: this.timeToMinutes(request.timeWindow!.startHour),
          endTime: this.timeToMinutes(request.timeWindow!.endHour)
        }

        const batchCallPayload = this.buildCallPayload(tasks, timeWindow)
        const batchCallResponse = await this.retellClient.batchCall.createBatchCall(batchCallPayload)
        this.logger.info(batchCallResponse.batch_call_id)
        this.logger.info('Full Retell Response:', JSON.stringify(batchCallResponse, null, 2))
        result.status = 'ok'
        result.message = `se han conseguido ${temporalContacts.length} contactos`
      } catch (error) {
        result.status = 'error'
        this.logger.info('Error Retell: ', error)
        result.message = (error as Error).message
      }
      return result
    }

    buildCallPayload (tasks:Task[], timeWindow?:any, timeStamp?:number): BatchCallCreateBatchCallParams {
      if (!timeStamp && !timeWindow) {
        throw new Error('Debe proporcionar timeWindow o timeStamp')
      }

      const baseParams = {
        from_number: process.env.TELF_ORIGIN!,
        tasks,
        reserved_concurrency: 1
      }

      if (timeStamp) {
        const params = {
          ...baseParams,
          trigger_timestamp: timeStamp
        }
        return params
      }

      const params = {
        ...baseParams,
        call_time_window: {
          windows: [{ start: timeWindow.startTime, end: timeWindow.endTime }],
          timezone: 'Europe/Madrid'
        }
      }
      return params
    }

    transformContactstoBatchCallTask (contacts:ContactDTO[]) {
      const tasks:Task[] = contacts.map(contact => ({
        to_number: contact.phoneNumber,
        retell_llm_dynamic_variables: {
          nombre: contact.name,
          apellido: contact.lastName,
          direccion: contact.address
        },
        metadata: {
          buildingId: contact.buildingId,
          ownerId: contact.ownerId,
          contactId: contact.contactId,
          city: contact.city,
          use: contact.use,
          callQueueId: contact.callQueueId,
          address: contact.address
        }
      }))

      return tasks
    }

    async saveScheduleDailyCalls (body:CityCallRequest[]) {
      await this.callScheduleRepo.clear()
      for (const city of body) {
        const callSchedule = this.callScheduleRepo.create({
          city: city.city,
          limit: city.limit,
          days: city.days,
          startHour: city.timeWindow?.startHour,
          endHour: city.timeWindow?.endHour
        })
        await this.callScheduleRepo.save(callSchedule)
      }
    }

    async readScheduleCalls (): Promise<CityCallResponse[]> {
      const schedules: CallSchedule[] = await this.getScheduleCalls()
      const results: CityCallResponse[] = []
      const date = new Date()
      const currentDay = date.getDay()

      if (schedules.length === 0) return [{ city: '', status: 'error', message: 'No hay lista de planificación' }]
      for (const s of schedules) {
        if (!this.isValidDay(currentDay, s.days!)) continue
        results.push(await this.makeBatchCall(s))
      }
      return results
    }

    async getScheduleCalls () {
      const callSchedule: CallSchedule [] = await this.callScheduleRepo.find()
      return callSchedule.map(entity => ({
        city: entity.city,
        limit: entity.limit,
        days: entity.days,
        timeWindow: {
          startHour: entity.startHour,
          endHour: entity.endHour
        }
      }))
    }

    isValidDay (day:number, days: string):boolean {
      if (days === '1-5') return day >= 1 && day <= 6
      return days.split(',').map(Number).includes(day)
    }

    timeToMinutes (time:string) {
      const [hours, minutes] = time.split(':').map(Number)
      return hours! * 60 + minutes!
    }

    formatMiliseconds (ms: number): string {
      const totalSeconds = Math.floor(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    normalizePhoneNumber (phone: string): string | null {
      if (!phone) return null
      if (phone.startsWith('+351')) return phone.slice(4)
      return phone.slice(3)
    }

    async saveCallLog (body:CallLogResponse) {
      const callLogRepo = await AppDataSource.getRepository(CallLog)
      const custom = body.call.call_analysis?.custom_analysis_data || {}
      const callAnalysis = body.call.call_analysis || {}
      const metadata = body.call.metadata || {}
      const buildingId = metadata.buildingId as string | undefined
      const ownerId = metadata.ownerId as string | undefined
      const contactId = metadata.contactId as string | undefined
      const scheduledAt = custom.scheduledAt as string | null
      const contactName = custom.contact_name as string | null

      if (buildingId && ownerId && contactId) {
        if (String(body.call.call_analysis?.custom_analysis_data?.vende).toLowerCase() === 'si') {
          try {
            await this.changeNegotiationStatus(buildingId)
          } catch (error) {
            console.log('Error changing negotiation status', error)
            throw error
          }
        }
      }

      const callLogMap = {
        startTime: body.call.start_timestamp ? new Date(body.call?.start_timestamp) : null,
        duration: body.call.duration_ms ? this.formatMiliseconds(body.call.duration_ms) : 0,
        toNumber: body.call.to_number || null,
        summary: callAnalysis.call_summary || null,
        endReason: body.call.disconnection_reason || null,
        recordings: body.call.recording_url || null,
        callId: body.call.call_id || null,
        tipoVivienda: metadata.use || null,
        status: body.call.call_status || null,
        ownerId: ownerId || null,
        cost: (body.call.call_cost?.combined_cost ?? 0) / 100 || 0,
        fromNumber: body.call.from_number || null,
        fromNumberNorm: body.call.from_number ? this.normalizePhoneNumber(body.call.from_number!) : null,
        toNumberNorm: body.call.from_number ? this.normalizePhoneNumber(body.call.to_number!) : null,
        name: body.call.agent_name || null,
        agentId: body.call.agent_id || null,
        metadata,
        provincia: metadata.city || null,
        buildingId: buildingId || null,
        contactId: contactId || null,
        interest: callAnalysis.user_sentiment || null,
        callSuccessful: callAnalysis.call_successful ?? null,
        vende: String(custom.vende || '').toLowerCase() === 'si',
        resumen: custom.resumen || null,
        noLlamar: String(custom.no_llamar || '').toLowerCase() === 'si',
        rellamada: String(custom.rellamada || '').toLowerCase() === 'si',
        callQueueId: metadata.callQueueId || null,
        scheduled_at: scheduledAt || null,
        contact_name: contactName || null
      }as unknown as DeepPartial<CallLog>

      const callLog: CallLog = callLogRepo.create(callLogMap)
      await callLogRepo.save(callLog)
      const notesParams = [callLog.resumen!, callLog.recordings!]
      if (callLog.vende === true) await this.saveBuildingNotes(buildingId!, notesParams)
      return await this.buildUmindCallLog(callLog)
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

    async buildUmindCallLog (callLog:DeepPartial<CallLog>) {
      const umindCallLog:UmindCallLog = {
        client_id: process.env.UMINDS_CLIENT_ID!,
        call_id: callLog.callId!,
        from_number: callLog.fromNumber,
        to_number: callLog.toNumber,
        duration: callLog.duration,
        status: callLog.status,
        transcript: callLog.transcript,
        summary: callLog.summary,
        recordings: callLog.recordings,
        end_reason: callLog.endReason,
        interest: callLog.interest,
        tipo_vivienda: callLog.tipoVivienda,
        cost: callLog.cost,
        metadata: callLog.metadata
      }
      return umindCallLog
    }

    async deleteCallSchedule () {
      await this.callScheduleRepo.clear()
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

    async configScheduledCall (body:RetellCustomFunctionResponse) {
      const metadata = body.call.metadata || {}
      const dynamicVar = body.call.retell_llm_dynamic_variables || {}
      const phoneNumber = body.call.to_number
      const scheduledAt = DateTime.fromISO(body.args.scheduled_at, { zone: 'Europe/Madrid' }).toMillis()

      this.logger.info(`metadata: ${JSON.stringify(metadata, null, 2)}`)
      this.logger.info(body.args.scheduled_at)
      this.logger.info(DateTime.fromMillis(scheduledAt).setZone('Europe/Madrid').toLocaleString(DateTime.DATETIME_MED))

      if (!phoneNumber) throw new Error('Missing phoneNumber in call payload')
      if (!metadata) throw new Error('Missing metadata in call payload')

      const contact: ContactDTO = {
        phoneNumber,
        name: String(dynamicVar.nombre),
        lastName: String(dynamicVar.apellido),
        buildingId: String(metadata.buildingId),
        ownerId: String(metadata.ownerId),
        contactId: String(metadata.contactId),
        city: String(metadata.city),
        use: String(metadata.use),
        callQueueId: String(metadata.callQueueId),
        address: String(dynamicVar.direccion)
      }
      const tasks = this.transformContactstoBatchCallTask([contact])
      const batchCallPayload = this.buildCallPayload(tasks, undefined, scheduledAt)
      try {
        const batchCallResponse = await this.retellClient.batchCall.createBatchCall(batchCallPayload)
        this.logger.info(`Batch call created:${batchCallResponse.batch_call_id}`)
      } catch (err:any) {
        this.logger.error(`Error creating batch call:${err.message || err}`)
        throw err
      }
    }

    async getLastCalledDate (buildingId:string, contactId:string) {
      const callQueueEntry = await AppDataSource.manager.findOne(CallQueue, {
        where: { buildingId, contactId }
      })

      if (!callQueueEntry?.lastCalledAt) return null
      return moment(callQueueEntry!.lastCalledAt).format('DD/MM/YY')
    }
}
