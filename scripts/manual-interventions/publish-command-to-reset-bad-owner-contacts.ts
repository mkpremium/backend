import { initLogger } from '../../src/infrastructure/logger'
import { SQS } from 'aws-sdk'
import _ from 'lodash'
// 35_597
import allOwners from './data/prod_owners_wo_contact_but_with_contacts_2023_26_11.json'
import Promise from 'bluebird'

const logger = initLogger()
const sqsClient = Promise.promisifyAll(new SQS({
  region: 'eu-west-1'
}), { suffix: 'Promise' })

const queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/events'


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
            MessageBody: JSON.stringify({
              listener: 'owner.reset_owner_discarded_contacts_command_handler',
              event: {
                name: 'owner.reset_owner_discarded_contacts_command',
                ownerId: entry.id
              }
            }),
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


