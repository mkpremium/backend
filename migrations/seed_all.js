import {N1qlQuery} from 'couchbase'
import couchbase from '../src/db/couchbase'
import {RelatedModel} from '../src/migration/lib/related-model'
import {MigrateEntities} from '../src/migration/lib/migrate-entities'
import Promise from 'bluebird'
import {cleanFirebase} from './firebase-clean'
import {WorksheetRepository} from '../src/worksheet/models/worksheet'
import {OwnerRepository} from '../src/owner/models'
import {HistoryRepository} from '../src/history/models'
import {Calls, CallsRawEvents} from '../src/calls/models'
import {ScheduledEventsRepository} from '../src/scheduled-events/models'
import {BuildingRepository} from '../src/building/models'
import {OperatorStats} from '../src/stats/models'
import {WorksheetQueueRepository} from '../src/worksheet/models/queue'
import {MigrateModelV2} from '../src/migration/lib/migrate-model-v2'
import {defaultFiles} from './defaults'
import {MigrateOwner} from '../src/migration/lib/migrate-owner'

export async function seed (files) {
  const app = {
    locals: {
      bucket: await couchbase()
    }
  }

  await deleteAll()
  await cleanQueue()

  const migrateBuildings = new MigrateModelV2('building', files.buildings, app)
  const migrateOwners = new MigrateOwner(files.owners, app)
  const relations = new RelatedModel(files.cross, app)
  const buildingEntities = new MigrateEntities(files.entities, app)

  await migrateBuildings.run()
  await migrateOwners.run()

  await relations.run()
  await buildingEntities.run()
}

async function deleteAll () {
  const worksheet = new WorksheetRepository()
  const owner = new OwnerRepository()
  const history = new HistoryRepository()
  const calls = new Calls()
  const callUnknownEvents = new CallsRawEvents()
  const scheduledEvent = new ScheduledEventsRepository()
  const building = new BuildingRepository()
  const stats = new OperatorStats()

  return Promise.all([
    cleanFirebase(),
    worksheet.deleteQuery(),
    owner.deleteQuery(),
    building.deleteQuery(),
    history.deleteQuery(),
    calls.deleteQuery(),
    scheduledEvent.deleteQuery(),
    callUnknownEvents.deleteQuery(),
    stats.deleteQuery()
  ])
}

async function cleanQueue () {
  const repo = new WorksheetQueueRepository()
  const bucket = repo.getBucketName()
  const cleanQueues = N1qlQuery.fromString(`UPDATE ${bucket} t SET worksheets = [], worksheetIndex = undefined WHERE t._documentType = 'worksheet-queue'`)
  const resetCounter = N1qlQuery.fromString(`DELETE FROM ${bucket} t WHERE META().id = 'counter:worksheet'`)
  await repo.queryRaw(cleanQueues)
  await repo.queryRaw(resetCounter)
}

if (require.main === module) {
  console.log('starting seed')
  seed(defaultFiles)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
