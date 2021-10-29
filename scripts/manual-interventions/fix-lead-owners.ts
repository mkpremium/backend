import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { Building, Lead, withCapturedLead } from '../../src/building/building'
import { initLogger } from '../../src/infrastructure/logger'
import { OwnerRepository } from '../../src/owner/repository/owner.repository'
import { mergeFeaturedContact, Owner } from '../../src/owner/owner'

const logger = initLogger()

export function migrate (dry = false) {
  return connectCouchbaseBucket()
    .then(bucket => {
      const couchbaseAdapter = new CouchbaseAdapter(bucket)
      return {
        couchbaseAdapter,
        buildingsRepository: new BuildingsRepository(couchbaseAdapter),
        ownersRepository: new OwnerRepository(couchbaseAdapter),
      }
    })
    .then(async ({ buildingsRepository, ownersRepository, couchbaseAdapter }) => {
      const leads = await leadsToFix(couchbaseAdapter)
      logger.info('leads to fix', leads)
      if (dry) {
        return
      }
      const counter = {
        success: [],
        failures: [],
      }
      for (const { id, lead } of leads) {
        try {
          const building = await buildingsRepository.get(id)
          await buildingsRepository.save(Building.update(building, {
            ownerId: {
              $set: lead.ownerId,
            }
          }))
          const owner = await ownersRepository.get(lead.ownerId)
          await ownersRepository.save(mergeFeaturedContact(owner, {
            phoneId: lead.contactId,
          }))
          counter.success.push(id)
          process.stdout.write('.')
        } catch (error) {
          process.stdout.write('x')
          counter.failures.push({ id, error: error.message })
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
      })
      logger.info(counter)
      process.exit(0)
    }).catch(error => {
    logger.error(error)
    process.exit(1)
  })
}

function leadsToFix (couchbaseAdapter: CouchbaseAdapter): Promise<{
  id: string,
  lead: Lead,
}[]> {
  const query = `
      SELECT id,
             lead
      FROM mkpremium
      WHERE _documentType = 'building'
        AND ownerId IS NULL
        AND lead IS NOT MISSING
  `

  return couchbaseAdapter.queryAsync(query)
}
