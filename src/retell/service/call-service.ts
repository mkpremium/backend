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
        city: request.city,
        status: 'ok',
        message: ''
      }
      try {
        const temporalContacts = await this.contactService.getCityContacts(request.city, request.limit)
        if (!temporalContacts) {
          result.status = 'error'
          result.message = 'No quedan contactos sin llamar'
          return result
        }
        this.logger.info(JSON.stringify(temporalContacts, null, 2))
        const tasks:Task[] = this.transformContactstoBatchCallTask(temporalContacts)
        this.logger.info(JSON.stringify(tasks, null, 2))

        const startHour = this.timeToMinutes(request.startHour)
        const endHour = this.timeToMinutes(request.endHour)

        const batchCallResponse = await this.retellClient.batchCall.createBatchCall({
          from_number: process.env.TELF_ORIGIN,
          tasks: tasks,
          call_time_window: {
            windows: [{ start: startHour, end: endHour }],
            timezone: 'Europe/Madrid'
          }
        } as any)

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
          city: contact.city,
          use: contact.use
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
        if (!this.isValidDay(currentDay, s.days)) continue
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
      const callLog = callLogRepo.create({
        duration: this.formatMiliseconds(body.call.duration_ms!),
        toNumber: body.call?.to_number,
        summary: body.call.call_analysis?.call_summary,
        transcript: body.call?.transcript,
        endReason: body.call?.disconnection_reason,
        recordings: body.call?.recording_url,
        callId: body.call?.call_id,
        tipoVivienda: body.call?.metadata?.use,
        status: body.call?.call_status,
        clientId: body.call?.metadata?.ownerId,
        cost: body.call?.call_cost,
        fromNumber: body.call?.from_number,
        fromNumberNorm: this.normalizePhoneNumber(body.call.from_number!),
        toNumberNorm: this.normalizePhoneNumber(body.call.to_number!),
        name: body.call?.agent_name,
        agentId: body.call?.agent_id,
        metadata: body.call?.metadata,
        provincia: body.call.metadata?.city,
        buildingId: body.call.metadata?.buildingId,
        interest: body.call.call_analysis?.user_sentiment
      }as unknown as DeepPartial<CallLog>)
      return await callLogRepo.save(callLog)
    }

    async deleteCallSchedule () {
      await this.callScheduleRepo.clear()
    }
}
