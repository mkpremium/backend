import * as fs from 'fs'
import chunk from 'lodash/chunk'
import aws from 'aws-sdk'
import { DomainEventCatalog } from '../../src/infrastructure/postgres/domain-event.entity'

const sqsClient = new aws.SQS({ region: 'eu-west-1' })

const buildingIdsToSyncWorksheet = JSON.parse(fs.readFileSync(process.env.BUILDINGS_TO_SYNC, 'utf8'))

chunk(buildingIdsToSyncWorksheet, 10)
  .forEach(async (batch: string[], idx) => {
    console.log(`Sending batch ${idx}`)
    await sqsClient.sendMessageBatch({
      QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/events',
      Entries: batch.map((buildingId) => ({
        Id: buildingId,
        MessageBody: JSON.stringify({
          event: {
            name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
            buildingId,
          },
          listener: 'worksheet.update_status'
        })
      }))
    }).promise().then(result => {
      if (result.Failed && result.Failed.length > 0) {
        console.error('Some messages failed', result.Failed)
      } else {
        console.log(`Batch ${idx} sent without errors`)
      }
    })
  })
