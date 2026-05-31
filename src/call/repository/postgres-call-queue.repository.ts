import { Repository } from 'typeorm'
import { AppDataSource } from '../../data-source'
import { CallQueue } from '../call-queue.entity'
import { ContactDTO } from '../types/contact-dto'

export class PostgresCallQueueRepository {
   private callLogRepository: Repository<CallQueue>

   constructor () {
     this.callLogRepository = AppDataSource.getRepository(CallQueue)
   }

   async checkExpiredFreezes () {
     await AppDataSource.query(`
        SELECT public.check_expired_call_queue_freezes()
     `)
   }

   async getCallCount (callQueueId:string) {
     const result = await AppDataSource.query(
       `SELECT call_count 
        FROM public.call_queue
        WHERE id = $1`, [callQueueId]
     )
     return result[0]?.call_count ?? null
   }

   async getBuildingIdFromCallQueue (city:string) {
     const row = await AppDataSource.query(`
        SELECT public.get_building_id($1) AS building_id
      `, [city])
     return row[0].building_id ?? null
   }

   async getContactByBuildingIdAndContactType (buildingId:string, contactType:string, prefix:string) {
     const contact = await AppDataSource.query(`
        SELECT * FROM public.get_building_contact($1,$2,$3)
      `, [buildingId, contactType, prefix])
     return contact[0] ?? null
   }

   async getAllCityContacts (city:string, limit:number, prefix:string, mobileStart:string) {
     const contacts: ContactDTO[] = await AppDataSource.query(`                  
                   -- Obtener contactos listos    
                   WITH s AS (
                        SELECT $3::text || c."value" AS "phoneNumber",                                
                                CONCAT(ba."type_full", ' ' ,ba."street", ' ', ba."number") AS address,
                                b.id AS "buildingId",
                                o.id AS "ownerId",
                                c.id AS "contactId",
                                ba.city AS "city",
                                b.use AS "use",
                                cq.id AS "callQueueId",
                                cq.last_called_at AS "lastCalledAt"
                        FROM call_queue cq
                        INNER JOIN owner o ON o.id = cq.owner_id
                        INNER JOIN building b ON b.id = cq.building_id   
                        INNER JOIN building_address ba ON ba.id = b."addressId"             
                        INNER JOIN contact c ON c.id = cq.contact_id
                        INNER JOIN person_contact pc ON pc."contactId" = cq.contact_id
                        INNER JOIN person p ON p.id = pc."personId"             
                        WHERE ba."city" = $1 
                          AND c."value" LIKE $4  
                          AND LENGTH(c."value") = 9        
                          AND cq.can_call = TRUE  
                          AND b."negotiationStatus" IN ('PENDIENTE')                          
                          AND o.type = 'PRINCIPAL'                   
                    )
                    SELECT DISTINCT ON ("phoneNumber")
                        "phoneNumber",                
                        address,
                        "buildingId",
                        "ownerId",
                        "contactId",
                        "city",
                        "use",
                        "callQueueId"              
                    FROM s
                    ORDER BY "phoneNumber", "lastCalledAt" ASC NULLS FIRST                      
                    LIMIT $2
                    `, [city, limit, prefix, mobileStart]
     )
     return contacts
   }

   async changeContactStatus (status:string, canCall:boolean, queueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
         SET 
          status = $1,
          can_call = $2
         WHERE id = $3`, [status, canCall, queueId]
     )
   }

   async changeAllBuildingSaleContactStatus (buildingId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
        SET 
          can_call = false,  
          status = CASE            
            WHEN status = 'PENDING' THEN 'CANCELLED_BY_SALE'
            ELSE status
          END,
          freeze_until = NULL,
          call_count = 0
        WHERE building_id = $1`, [buildingId]
     )
   }

   async freezeDoNotCall (calledAt:Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
       SET
          can_call = FALSE,
          freeze_until = NOW() + INTERVAL '6 months',
          status = 'DO_NOT_CALL',
          last_called_at = $1,
          call_count = 0
          WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async freezeSale (calledAt:Date, callQueueId:string) {
     await AppDataSource.query(
       ` UPDATE public.call_queue
            SET
                can_call = FALSE,
                last_called_at = $1,                
                status = 'SALE',
                call_count = 0
            WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async freezeNoSale (calledAt: Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
            SET
                can_call = FALSE,
                freeze_until = NOW() + INTERVAL '3 months',
                status = 'NO_SALE',
                last_called_at = $1,
                call_count = 0
            WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async markNoAnswer (calledAt: Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
          SET
              call_count = call_count + 1,
              last_called_at = $1,
              status = 'PENDING',
              can_call = true
          WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async markCallback (calledAt: Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
        SET
           can_call = false,
          status = 'CALLBACK'
          last_called_at = $1,
          call_count = 0
        WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async freezeNoAnswer (calledAt: Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
            SET
                can_call = false,
                freeze_until = NOW() + INTERVAL '1 months',
                status = 'NO_ANSWER',
                last_called_at = $1,
                call_count = 5
            WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async markAsDiscarded (calledAt: Date, callQueueId:string) {
     await AppDataSource.query(
       `UPDATE public.call_queue
            SET
                can_call = false,                
                status = 'DISCARDED',
                last_called_at = $1,
                call_count = 0
            WHERE id = $2`, [calledAt, callQueueId]
     )
   }

   async checkInProgressContactInBuilding (buildingId:string) {
     const result = await AppDataSource.query(
       `SELECT EXISTS(
          SELECT 1
          FROM public.call_queue
          WHERE building_id = $1
            AND status = 'IN_PROGRESS'
        ) AS "exists"`, [buildingId]
     )
     return result[0]?.exists === true
   }

   async checkInProgressContactInCity (city: string) {
     const result = await AppDataSource.query(
       `SELECT EXISTS(
          SELECT 1
          FROM public.call_queue cq
          INNER JOIN public.building b ON b.id=cq.building_id
          INNER JOIN public.building_address ba ON ba.id=b."addressId"
          WHERE ba.city = $1
          AND cq.status = 'IN_PROGRESS'
        ) AS "exists`, [city]
     )
     return result[0]?.exists === true
   }
}
