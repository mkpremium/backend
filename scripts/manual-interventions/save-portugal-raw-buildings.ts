import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import aws from 'aws-sdk'
import { initLogger } from '../../src/infrastructure/logger'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'

const logger = initLogger()
const QueueUrl = process.env.QUEUE_URL

exec()
  .then(() => {
    process.exit()
  })
  .catch(error => {
    console.error('Oops', { error: error.message, stack: error.stack })
    process.exit(1)
  })

async function exec () {
  const couchbaseBucket = await connectCouchbaseBucket()
  const sqsClient = new aws.SQS({ region: 'eu-west-1' })

  return loop(sqsClient, new CouchbaseAdapter(couchbaseBucket))
}

function loop (sqsClient, couchbaseAdapter: CouchbaseAdapter, retries = 2) {
  if (retries <= 0) {
    return Promise.resolve()
  }

  return sqsClient.receiveMessage({
    MaxNumberOfMessages: 1,
    QueueUrl,
  }).promise()
    .then(async ({ Messages }) => {
      if (!Messages || Messages.length === 0) {
        return new Promise(resolve => {
          logger.info('Empty response, waiting before continue polling')
          setTimeout(resolve, 5000)
        })
          .then(() => loop(sqsClient, couchbaseAdapter, retries - 1))
      }

      const message = Messages[ 0 ]
      const building = JSON.parse(message.Body)

      try {
        await couchbaseAdapter.insert(building.id, {
          ...building,
          status: 'INBOX',
          statusChangedAt: new Date(),
          _documentType: 'new-portugal-data',
        })
        logger.info('Building saved', { buildingId: building.id })
      } catch (error) {
        logger.error('Error processing message', {
          building,
          error: error,
          errorMessage: error.message,
          messageId: message.MessageId,
        })
      }

      await sqsClient.deleteMessage({
        QueueUrl: QueueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }).promise()

      return loop(sqsClient, couchbaseAdapter)
    })
}


