import { ContactService } from './contact-service'
import { initLogger } from '../../infrastructure/logger'
import { ContactDTO } from '../types/contact-dto'
import { Task } from '../types/task-call'
import { CityCallRequest, CityCallResponse } from '../types/call-batch-request-dto'
import { ScheduledTask } from 'node-cron'
import { AppDataSource } from '../../data-source'
import { CallSchedule } from '../call-schedule.entity'
import Retell from 'retell-sdk'
import { CallLogResponse } from '../types/call-log-response.dto'
import { CallLog } from '../call-log.entity'
import { DeepPartial } from 'typeorm'
import { Building } from '../../building/building.entity'
import { Flipper } from '../../flipper/flipper.entity'

export class CallService {
    private scheduleTask: ScheduledTask | null = null
    private callScheduleRepo = AppDataSource.getRepository(CallSchedule)

    constructor (
      private contactService: ContactService,
      private retellClient: Retell,
      private logger: ReturnType<typeof initLogger>
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

        const startHour = this.timeToMinutes(request.startHour!)
        const endHour = this.timeToMinutes(request.endHour!)

        const params = {
          from_number: process.env.TELF_ORIGIN!,
          tasks: tasks,
          reserved_concurrency: 0,
          call_time_window: {
            windows: [{ start: startHour, end: endHour }],
            timezone: 'Europe/Madrid'
          }
        }

        this.logger.info(params)
        const batchCallResponse = await this.retellClient.batchCall.createBatchCall(params)
        this.logger.info(batchCallResponse.batch_call_id)

        result.status = 'ok'
        result.message = `se han conseguido ${temporalContacts.length} contactos`
      } catch (error) {
        result.status = 'error'
        result.message = (error as Error).message
      }
      return result
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
          callQueueId: contact.callQueueId
        }
      }))

      return tasks
    }

    async saveScheduleDailyCalls (body:CityCallRequest[]) {
      await this.callScheduleRepo.clear()

      for (const city of body) {
        await this.callScheduleRepo.save(city)
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
      return callSchedule
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
      const buildingId = body.call.metadata?.buildingId as string | undefined
      if (buildingId) {
        if (String(body.call.call_analysis?.custom_analysis_data?.vende).toLowerCase() === 'si') {
          this.changeNegotiationStatus(buildingId)
        }
      }
      const metadata = body.call.metadata || {}
      const custom = body.call.call_analysis?.custom_analysis_data || {}
      const callAnalysis = body.call.call_analysis || {}

      const callLog = callLogRepo.create({
        startTime: body.call.start_timestamp ? new Date(body.call?.start_timestamp) : null,
        duration: body.call.duration_ms ? this.formatMiliseconds(body.call.duration_ms) : 0,
        toNumber: body.call.to_number || null,
        summary: callAnalysis.call_summary || null,
        transcript: body.call.transcript || null,
        endReason: body.call.disconnection_reason || null,
        recordings: body.call.recording_url || null,
        callId: body.call.call_id || null,
        tipoVivienda: metadata.use || null,
        status: body.call.call_status || null,
        ownerId: metadata.ownerId || null,
        cost: (body.call.call_cost?.combined_cost ?? 0) / 100 || 0,
        fromNumber: body.call.from_number || null,
        fromNumberNorm: body.call.from_number ? this.normalizePhoneNumber(body.call.from_number!) : null,
        toNumberNorm: body.call.from_number ? this.normalizePhoneNumber(body.call.to_number!) : null,
        name: body.call.agent_name || null,
        agentId: body.call.agent_id || null,
        metadata,
        provincia: metadata.city || null,
        buildingId: metadata.buildingId || null,
        contactId: metadata.contactId || null,
        interest: callAnalysis.user_sentiment || null,
        callSuccessful: callAnalysis.call_successful ?? null,
        vende: String(custom.vende || '').toLowerCase() === 'si',
        resumen: custom.resumen || null,
        noLlamar: String(custom.no_llamar || '').toLowerCase() === 'si',
        rellamada: String(custom.rellamada || '').toLowerCase() === 'si',
        callQueueId: metadata.callQueueId || null
      }as unknown as DeepPartial<CallLog>)
      return await callLogRepo.save(callLog)
    }

    async deleteCallSchedule () {
      await this.callScheduleRepo.clear()
    }

    async changeNegotiationStatus (buildingId:string) {
      const flipperId = '24113328-ed9d-4ca6-919d-630b2cd05062'
      const buildingRepo = AppDataSource.getRepository(Building)
      const flipperRepo = AppDataSource.getRepository(Flipper)
      const building = await buildingRepo.findOne({ where: { id: buildingId } })

      if (!building) {
        throw new Error(`Building with id ${buildingId} not found`)
      }

      const flipper = await flipperRepo.findOne({ where: { id: flipperId } })

      if (!flipper) {
        throw new Error(`Flipper with id ${flipperId} not found`)
      }

      building.negotiationStatus = 'PENDIENTE'
      building.assignedFlipper = flipper
      await buildingRepo.save(building)
    }
}
