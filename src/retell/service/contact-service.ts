import { AppDataSource } from '../../data-source'
import { initLogger } from '../../infrastructure/logger'
import { ContactDTO } from '../types/contact-dto'

export class ContactService {
  constructor (
        private logger: ReturnType<typeof initLogger>
  ) {}

  async getCityContacts (city:string, limit:number) {
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    const prefix = this.checkPrefixCountryCity(city)
    const mobileStart = prefix === '+34' ? '6%' : '9%'

    try {
      const contacts: ContactDTO[] = await queryRunner.query(
        `
                    WITH s AS (
                        SELECT $3::text || contact."value" AS "phoneNumber",                                
                                CONCAT(building_address."type", ' ', building_address."street", ' ', building_address."number") AS address,
                                building.id AS "buildingId",
                                owner.id AS "ownerId",
                                contact.id AS "contactId",
                                building_address.city AS "city",
                                building.use AS "use",
                                call_queue.id AS "call_queueId"
                        FROM owner
                        INNER JOIN building
                        ON owner."buildingId" = building.id
                        INNER JOIN person
                        ON owner."personId" = person.id
                        INNER JOIN person_contact
                        ON person_contact."personId" = person.id
                        INNER JOIN contact
                        ON contact.id = person_contact."contactId"
                        INNER JOIN building_address
                        ON building."addressId" = building_address.id
                        INNER JOIN call_queue 
                        ON call_queue."building_id" = building.id
                        WHERE building_address."city" = $1 
                          AND contact."value" LIKE $4       
                          AND (call_queue.can_call = TRUE OR (call_queue.freeze_until IS NOT NULL AND call_queue.freeze_until <= NOW()))    
                    )
                    SELECT
                    "phoneNumber",                
                    address,
                    "buildingId",
                    "ownerId",
                    "contactId",
                    "city",
                    "use",
                    "call_queueId"                
                    FROM s
                    LIMIT $2
                    `, [city, limit, prefix, mobileStart]
      )
      this.logger.info(`Fetched ${contacts.length} contacts for city=${city}`)
      return contacts
    } catch (error) {
      this.logger.error(`Error fetching contacts: ${(error as Error).message}`)
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  checkPrefixCountryCity (city:string) {
    const portugalCities = ['PORTO', 'LISBOA', 'VILA NOVA DE GAIA']
    if (portugalCities.includes(city.toUpperCase())) return '+351'
    return '+34'
  }
}
