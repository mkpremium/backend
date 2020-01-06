import couchbase from '../src/db/couchbase'

import {
  createFullOperator, operatorCreate, operatorCreateAdmin, operatorCreateBusiness,
  operatorCreateManager, operatorCreateStreet, operatorCreateStreetManager
} from '../test/common'

import {WorksheetQueueRepository} from '../src/worksheet/models/queue'

async function init () {
  await couchbase()

  const worksheetQueueRepo = new WorksheetQueueRepository()
  const queue = await worksheetQueueRepo.save({
    name: 'barcelona',
    source: {
      city: 'BARCELONA'
    }
  })

  await createFullOperator({
    username: `bitdistrict`,
    password: 'B1tdistrict',
    agentNumber: `10106-919`,
    serviceId: '17146',
    roles: [
      'OPERATOR'
    ],
    profile: {
      firstName: 'Bitdistrict',
      lastName: 'dev',
      city: 'barcelona',
      queueId: queue.id
    }
  })
  await operatorCreate('', queue.id)
  await operatorCreateAdmin(queue.id)
  await operatorCreateManager(queue.id)
  await operatorCreateBusiness()
  await operatorCreateStreet()
  await operatorCreateStreetManager()
}

init()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
