import fs from 'fs'
import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'
import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { withCapturedLead } from '../../src/building/building'

export function migrate (leadspath: string) {
  const leads: {
    buildingId: string
    createdBy: string
    contactId: string
    ownerId: string
    eventDate: string
    notifyTo: string
    worksheetId: string
  }[] = [ JSON.parse(fs.readFileSync(leadspath).toString('utf8'))[ 0 ] ]

  return connectCouchbaseBucket()
    .then(bucket => {
      return new BuildingsRepository(new CouchbaseAdapter(bucket))
    })
    .then(async buildingsRepository => {
      const counter = {
        success: 0,
        failures: 0,
      }
      for (const { buildingId, contactId, notifyTo, ownerId, worksheetId } of leads) {
        try {
          const building = await buildingsRepository.get(buildingId)
          await buildingsRepository.save(withCapturedLead(building, notifyTo, {
            ownerId,
            contactId,
            worksheetId,
          }))
          counter.success++
          process.stdout.write('.')
        } catch (error) {
          console.error(error.message, { buildingId: buildingId })
          counter.failures++
        }
      }

      return counter
    })
}

if (process.env.AUTO_INVOKE) {
  migrate(process.env.LEADS_PATH)
    .then((counter) => {
      console.info('Done!', counter)
      process.exit(0)
    }).catch(error => {
    console.error(error)
    process.exit(1)
  })
}
