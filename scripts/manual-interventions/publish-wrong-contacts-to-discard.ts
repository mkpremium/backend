import * as fs from 'fs'
import chunk from 'lodash/chunk'
import aws from 'aws-sdk'

const sqsClient = new aws.SQS({ region: 'eu-west-1' })

const contactsToDiscard = JSON.parse(fs.readFileSync(process.env.WRONG_CONTACTS_PATH, 'utf8'))

chunk(contactsToDiscard, 10)
  .forEach(async (batch) => {
    await sqsClient.sendMessageBatch({
      QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/events.fifo',
      Entries: batch.map(({ id, ownerId, contactId, worksheetId }) => ({
        Id: id,
        MessageDeduplicationId: id,
        MessageGroupId: id,
        MessageBody: JSON.stringify({
          event: {
            name: 'virtual-caller.unexisting_phone_found',
            ownerId,
            contactId,
            worksheetId,
          },
          listener: 'owner.discard_non_existing_contact'
        })
      }))
    }).promise().then(result => {
      if (result.Failed && result.Failed.length > 0) {
        console.error('Some messages failed', result.Failed)
      }
    })
  })

