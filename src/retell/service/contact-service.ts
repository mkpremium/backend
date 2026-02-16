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
                                person."fullName",
                                regexp_split_to_array(trim("fullName"), '\\s+') AS full_name,
                                CONCAT(building_address."type", ' ', building_address."street", ' ', building_address."number") AS address,
                                building.id AS "buildingId",
                                owner.id AS "ownerId",
                                building_address.city AS "city",
                                building.use AS "use"
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
                        WHERE building_address."city" = $1 
                          AND contact."value" LIKE $4             
                          AND fullName NOT LIKE '% SL'
                          AND fullName NOT LIKE '% SA'
                          AND fullName NOT LIKE '% S.L'
                          AND fullName NOT LIKE '% S.A'
                          AND fullName NOT LIKE '% S.L.'
                          AND fullName NOT LIKE '% S.A.'
                          AND NOT EXISTS (
                                SELECT 1
                                FROM call_logs cl
                                WHERE cl.to_number_norm = contact."value"
                                  AND cl.status <> 'not_connected'
                          )
                    )
                    SELECT 

                    "phoneNumber",  
                
                    CASE 
                        WHEN array_length(full_name,1) > 2 THEN array_to_string(full_name[3:array_length(full_name,1)], ' ')
                        ELSE ''
                    END AS name,
                
                    array_to_string(full_name[1:2], ' ') AS "lastName",
                    address,
                    "buildingId",
                    "ownerId",
                    "city",
                    "use"                
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
