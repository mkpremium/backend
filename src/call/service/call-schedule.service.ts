import { initLogger } from '../../infrastructure/logger'
import { CallScheduleProps } from '../models/call-schedule.model'
import { PostgresCallScheduleRepository } from '../repository/postgres-call-schedule.repository'
import { CityCallRequest } from '../types/call-batch-request-dto'
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

   async readCallSchedule () {
     try {
       const schedules: CallScheduleProps[] | null = await this.callScheduleRepository.getAll()
       const currentDay = new Date().getDay()

       if (!schedules || schedules.length === 0) return { status: 'error', message: 'No hay lista de planificación' }

       for (const schedule of schedules) {
         if (!isValidDay(currentDay, schedule.days)) {
           this.logger.info(`Hoy no toca ejecutar llamadas para ${schedule.city}`)
           continue
         }
         const result = await this.callService.processNextBuilding(schedule.city)
         this.logger.info(`[processNextBuilding] ${result}`)
         if (result?.status === 'empty') {
           this.logger.info(`No quedan contactos pendientes para ${schedule.city}`)
           continue
         }
         if (result.status === 'finished') {
           this.logger.info(`Ya se gestionaron todos los edificios del día para ${schedule.city}`)
           continue
         }
       }
       return { status: 'ok', message: 'Planificaciones procesadas' }
     } catch (error) {
       if (error instanceof Error) this.logger.error(error.message)
       return { status: 'error', message: 'Error leyendo planificación de llamadas' }
     }
   }

   async getCallSchedule () {
     return await this.callScheduleRepository.getAll()
   }

   async deleteCallSchedule () {
     await this.callScheduleRepository.deleteAll()
   }

   async updateDailyRemainingBuildings (city:string) {
     await this.callScheduleRepository.updateDailyRemainingBuildings(city)
   }

   async getDailyRemainingBuildings (city:string) {
     return await this.callScheduleRepository.getDailyRemainingBuildings(city)
   }

   async resetDailyRemainingBuildings () {
     await this.callScheduleRepository.resetDailyRemainingBuildings()
   }
}
