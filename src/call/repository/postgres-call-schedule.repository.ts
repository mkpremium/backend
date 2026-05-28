import { DeepPartial, Repository } from 'typeorm'
import { CallSchedule } from '../call-schedule.entity'
import { CallScheduleProps } from '../models/call-schedule.model'
import { AppDataSource } from '../../data-source'

export class PostgresCallScheduleRepository {
  private callScheduleRepository: Repository<CallSchedule>

  constructor () {
    this.callScheduleRepository = AppDataSource.getRepository(CallSchedule)
  }

  async saveAll (callScheduleList: CallScheduleProps[]):Promise<void> {
    await this.callScheduleRepository.clear()
    const callScheduleToSave = callScheduleList.map(cityCallSchedule => this.structToEntity(cityCallSchedule))
    await this.callScheduleRepository.save(callScheduleToSave)
  }

  async getAll ():Promise<CallScheduleProps[]> {
    const callScheduleList = await this.callScheduleRepository.find()
    return callScheduleList.map(cityCallSchedule => this.entityToStruct(cityCallSchedule))
  }

  async getFirst ():Promise<CallScheduleProps | null> {
    const result = await AppDataSource.query(
      `SELECT * 
       FROM public.call_schedule 
       LIMIT 1`
    )

    return result[0] ?? null
  }

  async updateDailyRemainingBuildings (city:string) {
    await AppDataSource.query(
      `UPDATE public.call_schedule
        SET daily_remaining_buildings = daily_remaining_buildings - 1
        WHERE city = $1
        AND daily_remaining_buildings > 0
        `, [city]
    )
  }

  async resetDailyRemainingBuildings () {
    await AppDataSource.query(
      `UPDATE public.call_schedule
      SET daily_remaining_buildings = daily_limit`
    )
  }

  async getDailyRemainingBuildings (city:string) {
    const result = await AppDataSource.query(
      `SELECT daily_remaining_buildings 
      FROM call_schedule
      WHERE city =$1`, [city]
    )
    return result[0]?.daily_remaining_buildings ?? null
  }

  async deleteAll () {
    await this.callScheduleRepository.clear()
  }

  protected structToEntity (cityCallSchedule: CallScheduleProps): DeepPartial<CallSchedule> {
    return {
      city: cityCallSchedule.city,
      limit: cityCallSchedule.limit,
      days: cityCallSchedule.days,
      startHour: cityCallSchedule.timeWindow?.startHour,
      endHour: cityCallSchedule.timeWindow?.endHour,
      dailyRemainingBuildings: cityCallSchedule.limit
    }
  }

  protected entityToStruct (entity: CallSchedule): CallScheduleProps {
    return {
      city: entity.city,
      limit: entity.limit,
      days: entity.days,
      timeWindow: {
        startHour: entity.startHour,
        endHour: entity.endHour
      },
      daily_remaining_buildings: entity.dailyRemainingBuildings
    }
  }
}
