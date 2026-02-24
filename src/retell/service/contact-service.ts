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
                        SELECT $3::text || c."value" AS "phoneNumber",                                
                                CONCAT(ba."type", ' ', ba."street", ' ', ba."number") AS address,
                                b.id AS "buildingId",
                                o.id AS "ownerId",
                                c.id AS "contactId",
                                ba.city AS "city",
                                b.use AS "use",
                                cq.id AS "call_queueId"
                        FROM call_queue cq
                        INNER JOIN owner o
                        ON o.id = cq.owner_id
                        INNER JOIN building b
                        ON b.id = cq.building_id   
                        INNER JOIN building_address ba
                        ON ba.id = b."addressId"             
                        INNER JOIN contact c
                        ON c.id = cq.contact_id
                        INNER JOIN person_contact pc
                        ON pc."contactId" = cq.contact_id
                        INNER JOIN person p
                        ON p.id = pc."personId"             
                        WHERE ba."city" = $1 
                          AND c."value" LIKE $4       
                          AND (cq.can_call = TRUE OR (cq.freeze_until IS NOT NULL AND cq.freeze_until <= NOW()))    
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
