import { initLogger } from '../../src/infrastructure/logger'
import { SQS } from 'aws-sdk'
import _ from 'lodash'
// 342_348
import allOwners from '/Users/jorge/Downloads/owner_ids.json'
import Promise from 'bluebird'

const logger = initLogger()
const sqsClient = Promise.promisifyAll(new SQS({
  region: 'eu-west-1'
}), { suffix: 'Promise' })

const queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/events-dev'


console.time('Chunking owners')
logger.info('Chunking owners', { length: (allOwners as []).length })
const chunks = _.chunk(allOwners as { id: string }[], 10)
console.timeEnd('Chunking owners')

Promise.all(
  chunks
    .map(batch => new Promise<SQS.SendMessageBatchResult>((resolve, reject) => {
        sqsClient.sendMessageBatch({
          QueueUrl: queueUrl,
          Entries: batch.map(entry => ({
            Id: entry.id,
            MessageBody: JSON.stringify(entry),
          }))
        }, (err: Error, result: SQS.SendMessageBatchResult) => {
          if (err) {
            reject(err)
          } else {
            resolve(result)
          }
        })

      })
    )
).then(results => {
  results.forEach(batchResult => {
    batchResult.Failed.forEach(console.error)
  })
  console.log('Done!')
  process.exit()
}).catch(err => {
  console.error(err)
  process.exit(1)
})


