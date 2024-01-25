import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { N1qlQuery } from 'couchbase'
import { SQS } from 'aws-sdk'
import { initLogger } from '../../src/infrastructure/logger'
import { CommandPublisher } from '../../src/infrastructure/event-bus/command-publisher'
import { DomainEventCatalog } from '../../src/infrastructure/postgres/domain-event.entity'
import { commandHandlerName } from '../../src/infrastructure/listeners'

const logger = initLogger()
const sqsClient = new SQS({
  region: 'eu-west-1'
})

const DOCUMENTS_CONDITION = process.env[ 'DOCUMENTS_CONDITION' ]
if (!DOCUMENTS_CONDITION) {
  throw new Error('Missing DOCUMENTS_CONDITION environment variable.')
}

const QUEUE_URL = process.env.EVENTS_QUEUE_URL
const ADD_ONLY = (process.env.ADD_ONLY ?? 'true') === 'true'

connectCouchbaseBucket()
  .then(bucket => {
    return new Promise((resolve, reject) => {
      const commandPublisher = new CommandPublisher(
        sqsClient,
        QUEUE_URL,
        commandHandlerName(DomainEventCatalog.CMD__POSTGRES__MIGRATION__SAVE_DOCUMENTS),
        logger,
        ADD_ONLY,
      )
      const allDocumentsQuery = bucket.query(
        N1qlQuery.fromString(`SELECT mkpremium.id
                              FROM mkpremium
                              WHERE ${DOCUMENTS_CONDITION}`)
      )
      allDocumentsQuery.on('error', reject)
      allDocumentsQuery.on('row', (row) => {
        commandPublisher.push(row)
          .catch(error => {
            logger.error('Couldn\'t publish row', { row })
            reject(error)
          })
      })
      allDocumentsQuery.on('end', () => {
        commandPublisher.flushPendingMessages()
          .then(resolve)
          .catch(reject)
      })
    })
  })
  .then(() => process.exit())
  .catch(error => {
    logger.error(`An error occurred: ${error}`)
    console.trace(error)
    process.exit(1)
  })


