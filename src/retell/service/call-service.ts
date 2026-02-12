import { ContactService } from './contact-service'
import { initLogger } from '../../infrastructure/logger'
import { ContactDTO } from '../types/contact-dto'
import { Task } from '../types/task-call'
import { CityCallRequest, CityCallResponse } from '../types/call-batch-request-dto'
import { ScheduledTask } from 'node-cron'
import { AppDataSource } from '../../data-source'
import { CallSchedule } from '../call-schedule.entity'
import Retell from 'retell-sdk'

export class CallService {
    private scheduleTask: ScheduledTask | null = null

    constructor (
      private contactService: ContactService,
      private retellClient: Retell,
      private logger: ReturnType<typeof initLogger>
    ) {}

    async makeBatchCall (request:CityCallRequest) {
      const result: CityCallResponse = {
        city: request.city,
        status: 'ok',
        info: ''
      }
      try {
        const temporalContacts = await this.contactService.getCityContacts(request.city, request.limit)
        if (!temporalContacts) {
          result.status = 'error'
          result.info = 'No quedan contactos sin llamar'
          return result
        }
        this.logger.info(JSON.stringify(temporalContacts, null, 2))
        const tasks:Task[] = this.transformContactstoBatchCallTask(temporalContacts)
        this.logger.info(JSON.stringify(tasks, null, 2))
        /*
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
        */
        result.status = 'ok'
        result.info = `se han conseguido ${temporalContacts.length} contactos`
      } catch (error) {
        result.status = 'error'
        result.info = (error as Error).message
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
        }
      }))

      return tasks
    }

    async saveScheduleDailyCalls (body:CityCallRequest[]) {
      const callScheduleRepo = AppDataSource.getRepository(CallSchedule)
      await callScheduleRepo.clear()

      for (const city of body) {
        await callScheduleRepo.save(city)
      }
    }

    async readScheduleCalls () {
      const callScheduleRepo = await AppDataSource.getRepository(CallSchedule)
      const results: CityCallResponse[] = []
      const schedules = await callScheduleRepo.find()
      const date = new Date()
      const currentDay = date.getDay()

      for (const s of schedules) {
        if (!this.isValidDay(currentDay, s.days)) continue
        results.push(await this.makeBatchCall(s))
      }

      if (results.length === 0) return { Error: 'Lista de llamadas sin procesar' }
      return results
    }

    async getScheduleCalls () {
      const callScheduleRepo = await AppDataSource.getRepository(CallSchedule)
      const callSchedule: CallSchedule [] = await callScheduleRepo.find()

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
}
