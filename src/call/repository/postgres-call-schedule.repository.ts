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

  async deleteAll () {
    await this.callScheduleRepository.clear()
  }

  protected structToEntity (cityCallSchedule: CallScheduleProps): DeepPartial<CallSchedule> {
    return {
      city: cityCallSchedule.city,
      limit: cityCallSchedule.limit,
      days: cityCallSchedule.days,
      startHour: cityCallSchedule.timeWindow?.startHour,
      endHour: cityCallSchedule.timeWindow?.endHour
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
      }
    }
  }
}
