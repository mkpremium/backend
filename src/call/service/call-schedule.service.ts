import { initLogger } from '../../infrastructure/logger'
import { CallScheduleProps } from '../models/call-schedule.model'
import { PostgresCallScheduleRepository } from '../repository/postgres-call-schedule.repository'
import { CityCallRequest, CityCallResponse } from '../types/call-batch-request-dto'
import { isValidDay } from '../utils/call-service-utils'
import { CallService } from './call.service'
import { ScheduledTask } from 'node-cron'

export class CallScheduleService {
   private scheduleTask: ScheduledTask | null = null

   constructor (
        private callService: CallService,
        private logger: ReturnType<typeof initLogger>,
        private callScheduleRepository: PostgresCallScheduleRepository
   ) {}

   async saveCallSchedule (body:CityCallRequest[]) {
     await this.callScheduleRepository.saveAll(body)
   }

   async readCallSchedule (): Promise<CityCallResponse[]> {
     const schedules: CallScheduleProps[] = await this.callScheduleRepository.getAll()
     this.logger.debug({ schedules })
     const results: CityCallResponse[] = []
     const date = new Date()
     const currentDay = date.getDay()

     if (schedules.length === 0) return [{ city: '', status: 'error', message: 'No hay lista de planificación' }]
     for (const s of schedules) {
       try {
         if (!isValidDay(currentDay, s.days!)) continue
         results.push(await this.callService.makeBatchCall(s))
       } catch (error) {
         if (error instanceof Error) this.logger.error(error.message)
         continue
       }
     }
     return results
   }

   async getCallSchedule () {
     return await this.callScheduleRepository.getAll()
   }

   async deleteCallSchedule () {
     await this.callScheduleRepository.deleteAll()
   }
}
