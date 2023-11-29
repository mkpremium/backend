import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { N1qlQuery } from 'couchbase'
import { SQS } from 'aws-sdk'
import { initLogger } from '../../src/infrastructure/logger'
import { Id, Identifiable } from '../../src/infrastructure/postgres/save-documents-command-handler'
import _ from 'lodash'

const logger = initLogger()
const sqsClient = new SQS({
  region: 'eu-west-1'
})

const DOCUMENTS_CONDITION = process.env["DOCUMENTS_CONDITION"]
if (!DOCUMENTS_CONDITION) {
  throw new Error('Missing DOCUMENTS_CONDITION environment variable.')
}

connectCouchbaseBucket()
  .then(bucket => {
    return new Promise((resolve, reject) => {
      const commandPublisher = new CommandPublisher(sqsClient)
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


const BATCH_SIZE = 1_000

class CommandPublisher {
  private buffer: Id[] = []
  private isBatchSendingInProgress = false

  constructor (
    private sqs: SQS,
    private queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/events-dev'
  ) {
  }

  async push (obj: Identifiable) {
    this.buffer.push(obj.id)
    const bufferLength = this.buffer.length
    if (bufferLength >= BATCH_SIZE) {
      if (this.isBatchSendingInProgress) {
        logger.warning('Batch sending in progress, not sending next batch')
        return
      }
      logger.info('Publishing next batch', { bufferSize: bufferLength })
      const nextBatch = this.buffer.splice(0, BATCH_SIZE)
      await this.publishBatch(nextBatch)
    }
  }

  async flushPendingMessages (retries = 3) {
    if (this.isBatchSendingInProgress) {
      if (retries === 0) {
        throw new Error('Couldn\'t flush pending messages')
      }

      logger.warning('Batch sending in progress, waiting 500ms before trying again')
      return new Promise(resolve => setTimeout(resolve, 500))
        .then(() => this.flushPendingMessages(retries - 1))
    }

    while (this.buffer.length > 0) {
      const nextBatch = this.buffer.splice(0, BATCH_SIZE)
      await this.publishBatch(nextBatch)
    }
  }

  async publishBatch (batch: Id[]) {
    this.isBatchSendingInProgress = true
    const chunks = _.chunk(batch, BATCH_SIZE / 10)
    try {
      return await this.sqs.sendMessageBatch({
        QueueUrl: this.queueUrl,
        Entries: chunks.map((chunk, idx) => ({
          Id: `chunk-${idx}`,
          MessageBody: JSON.stringify({
            listener: 'postgres.save_documents_command_handler',
            event: {
              name: 'postgres.save_documents_command',
              ids: chunk,
            }
          }),
        }))
      }).promise().then(batchResult => {
        batchResult.Failed.forEach(console.error)
      })
    } finally {
      this.isBatchSendingInProgress = false
    }
  }
}


