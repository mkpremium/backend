import { AppDataSource } from '../../data-source'
import { initLogger } from '../../infrastructure/logger'
import { PostgresCallQueueRepository } from '../repository/postgres-call-queue.repository'
import { ContactDTO } from '../types/contact-dto'
import { ContactType } from '../types/contact-types'
export class ContactService {
  constructor (
        private logger: ReturnType<typeof initLogger>,
        private callQueueRepository: PostgresCallQueueRepository
  ) {}

  async checkExpiredFreezes () {
    try {
      await this.callQueueRepository.checkExpiredFreezes()
    } catch (error) {
      this.logger.error(`Error checking call queue freezes: ${(error as Error).message}`)
      throw error
    }
  }

  async getBuildingIdFromCallQueue (city:string) {
    try {
      const buildingId = await this.callQueueRepository.getBuildingIdFromCallQueue(city)
      return buildingId
    } catch (error) {
      this.logger.error(`Error getting building id from call queue: ${(error as Error).message}`)
      throw error
    }
  }

  async getContactByBuildingIdAndContactType (buildingId:string, contactType:string, prefix:string) {
    try {
      const contact = await this.callQueueRepository.getContactByBuildingIdAndContactType(buildingId, contactType, prefix)
      return contact
    } catch (error) {
      this.logger.error(`Error getting building contact from call queue: ${(error as Error).message}`)
      throw error
    }
  }

  async getCityContacts (city:string, limit:number) {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    const prefix = this.checkPrefixCountryCity(city)
    const mobileStart = prefix === '+34' ? '6%' : '9%'

    try {
      const contacts: ContactDTO[] = await this.callQueueRepository.getAllCityContacts(city, limit, prefix, mobileStart)
      this.logger.info(`Fetched ${contacts.length} contacts for city=${city}`)
      return contacts
    } catch (error) {
      this.logger.error(`Error fetching contacts: ${(error as Error).message}`)
      throw error
    }
  }

  checkPrefixCountryCity (city:string) {
    const portugalCities = ['PORTO', 'LISBOA', 'VILA NOVA DE GAIA']
    if (portugalCities.includes(city.toUpperCase())) return '+351'
    return '+34'
  }

  async changeContactStatus (status:string, canCall: boolean, queueId:string) {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    try {
      await this.callQueueRepository.changeContactStatus(status, canCall, queueId)
    } catch (error) {
      this.logger.error(`Error fetching contact: ${(error as Error).message}`)
      throw error
    }
  }

  async getNextContactInBuilding (city:string, buildingId: string) {
    const contactTypePriorities = [
      ContactType.PRINCIPAL,
      ContactType.SECUNDARIO,
      ContactType.MISMA_CASA,
      ContactType.HERMANOS,
      ContactType.HIJOS,
      ContactType.FAMILIAR,
      ContactType.VECINO,
      ContactType.NINGUNO
    ]

    for (const contactType of contactTypePriorities) {
      const prefix = this.checkPrefixCountryCity(city)
      this.logger.info(`[getNextContactInBuilding] START city=${city} buildingId=${buildingId}`)
      const contact = await this.getContactByBuildingIdAndContactType(buildingId, contactType, prefix)
      this.logger.info(`[getNextContactInBuilding] START city=${city} buildingId=${buildingId}`)
      if (contact) return contact
    }
    return null
  }

  async checkInProgressContactInBuilding (buildingId:string) {
    return await this.callQueueRepository.checkInProgressContactInBuilding(buildingId)
  }

  async checkInProgressContactInCity (city:string) {
    return await this.callQueueRepository.checkInProgressContactInCity(city)
  }

  async markCallback (calledAt: Date, callQueueId:string) {
    await this.callQueueRepository.markCallback(calledAt, callQueueId)
  }
}
