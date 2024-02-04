import { SQS } from 'aws-sdk'
import fs from 'fs'
import util from 'util'
import { DomainEventCatalog } from '../../src/infrastructure/postgres/domain-event.entity'

const sqsClient = new SQS({ region: 'eu-west-1' })
const QUEUE_URL = process.env.QUEUE_URL // Replace with your SQS Queue URL
const FILE_PATH = process.env.FILE_PATH // Replace with your TXT file path

if (!QUEUE_URL) {
  throw new Error('Missing QUEUE_URL environment variable.')
}

if (!FILE_PATH) {
  throw new Error('Missing FILE_PATH environment variable.')
}

const readFile = util.promisify(fs.readFile)

// Function to chunk an array into smaller arrays
function chunkArray (array: any[], chunkSize: number): any[][] {
  let index = 0
  let arrayLength = array.length
  let tempArray = []

  for (index = 0; index < arrayLength; index += chunkSize) {
    let chunk = array.slice(index, index + chunkSize)
    tempArray.push(chunk)
  }

  return tempArray
}

async function sendMessages () {
  const content = await readFile(FILE_PATH, 'utf-8')
  const buildingIds = content.split('\n')

  const batches = chunkArray(buildingIds, 10) // Adjust batch size as needed

  for (const batch of batches) {
    const entries = batch.map((id, index) => ({
      Id: index.toString(),
      MessageBody: JSON.stringify({
        event: {
          name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
          buildingId: id,
        },
        listener: 'postgres_migration.import_building_worksheets',
      }),
    }))

    const params = {
      QueueUrl: QUEUE_URL,
      Entries: entries,
    }

    try {
      const data = await sqsClient.sendMessageBatch(params).promise()
      console.log(`Batch sent successfully: ${data.Successful.length} messages`)
    } catch (err) {
      console.error(`An error occurred while sending the batch: ${err}`)
    }
  }
}

sendMessages()
