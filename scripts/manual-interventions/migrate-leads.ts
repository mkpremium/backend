import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { withCapturedLead } from '../../src/building/building'
import { initLogger } from '../../src/infrastructure/logger'

const logger = initLogger()
export function migrate (dry = false) {
  return connectCouchbaseBucket()
    .then(bucket => {
      const couchbaseAdapter = new CouchbaseAdapter(bucket)
      return {
        couchbaseAdapter,
        buildingsRepository: new BuildingsRepository(couchbaseAdapter)
      }
    })
    .then(async ({ buildingsRepository, couchbaseAdapter }) => {
      const leads = await leadsToMigrate(couchbaseAdapter)
      logger.info('leads to migrate', leads)
      if (dry) {
        return
      }
      const counter = {
        success: [],
        failures: [],
        skipped: [],
      }
      for (const { buildingId, contactId, notifyTo, ownerId, worksheetId, scheduledCallId } of leads) {
        try {
          const building = await buildingsRepository.get(buildingId)
          if (building.negotiationStatus && building.negotiationStatus !== 'PENDIENTE') {
            counter.skipped.push({ scheduledCallId, buildingId, negotiationStatus: building.negotiationStatus })
            process.stdout.write('-')
            continue
          }
          await buildingsRepository.save(withCapturedLead(building, notifyTo, {
            ownerId,
            contactId,
            worksheetId,
          }))
          counter.success.push(scheduledCallId)
          process.stdout.write('.')
        } catch (error) {
          process.stdout.write('x')
          counter.failures.push({ scheduledCallId, error: error.message })
        }
      }

      return counter
    })
}

if (process.env.AUTO_INVOKE) {
  migrate(process.env.DRY === 'true')
    .then((counter) => {
      logger.info(`Done!`, {
        success: counter.success.length,
        failures: counter.failures.length,
        skipped: counter.skipped.length,
      })
      logger.info(counter)
      process.exit(0)
    }).catch(error => {
    logger.error(error)
    process.exit(1)
  })
}

function leadsToMigrate (couchbaseAdapter: CouchbaseAdapter): Promise<{
  scheduledCallId: string
  buildingId: string
  createdBy: string
  contactId: string
  ownerId: string
  eventDate: string
  notifyTo: string
  worksheetId: string
}[]> {
  const query = `
      SELECT id scheduledCallId,
             eventDate capturedAt,
             notiftyTo assignTo,
             event.buildingId,
             event.contactId,
             event.ownerId,
             event.worksheetId
      FROM mkpremium
      WHERE _documentType = 'scheduled-event'
        AND type = 'CALLS'
        AND createdBy != notifyTo
  `

  return couchbaseAdapter.queryAsync(query)
}
