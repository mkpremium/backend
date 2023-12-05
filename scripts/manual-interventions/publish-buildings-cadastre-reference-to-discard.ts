import * as fs from 'fs'
import * as readline from 'readline'
import aws from 'aws-sdk'

const sqsClient = new aws.SQS({ region: 'eu-west-1' })

const stream = fs.createReadStream(process.env.CSV_PATH)
const reader = readline.createInterface({ input: stream })
const pending = {}

reader.on('line', async (row) => {
  // cadastre reference are 20 characters long
  if (row.length < 20) {
    return
  }

  try {
    const cadastreReference = row.substr(0, 20)
    pending[ cadastreReference ] = true
    await sqsClient.sendMessage({
      MessageBody: JSON.stringify({
        cadastreReference: cadastreReference,
      }),
      QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/metadata-to-delete',
    }).promise()
    pending[ cadastreReference ] = false
  } catch (error) {
    console.error('Cannot put message in queue', error)
    process.exit(1)
  }
})
reader.on('error', error => {
  console.error('Cannot read file', error)
  process.exit(1)
})
reader.on('close', () => {
  setInterval(() => {
    const nbOfPendingMessages = Object.keys(pending).filter(Boolean).length
    if (nbOfPendingMessages === 0) {
      console.log('Done!')
      process.exit()
    } else {
      console.log('waiting for messages', { nbOfPendingMessages })
    }
  }, 1000)
})
