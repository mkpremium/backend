import AWS, { SQS } from 'aws-sdk'
import Promise from 'bluebird'
import activeOwners from '/tmp/active-owners.json'
import _ from 'lodash'

AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'mkjorge' })

AWS.config.update({ region: 'eu-west-1' })
const sqsClient = Promise.promisifyAll(new SQS(), { suffix: 'Promise' })

const queueUrl = 'https://sqs.eu-west-1.amazonaws.com/173249668334/owners-to-update.fifo'

Promise.all(_.chunk(activeOwners, 10)
  .map(batch =>
    sqsClient.sendMessageBatchPromise({
      QueueUrl: queueUrl,
      Entries: batch.map(entry => ({
        Id: entry.ownerId,
        MessageBody: JSON.stringify(entry),
        MessageGroupId: 'active-owners'
      }))
    })
  )
).then(results => {
  results.forEach(batchResult => {
    batchResult.Failed.forEach(console.error)
  })
  process.exit()
}).catch(err => {
  console.error(err)
  process.exit(1)
})
