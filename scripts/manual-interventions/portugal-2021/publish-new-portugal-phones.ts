import readline from 'readline'
import aws from 'aws-sdk'
import uuid from 'uuid/v4'

exec()
  .then(() => {
    process.exit()
  })
  .catch(error => {
    console.error('Oops', { error: error.message, stack: error.stack })
    process.exit(1)
  })

async function exec () {
  const s3Client = new aws.S3({ region: 'eu-west-2' })
  const stream = s3Client.getObject({
    Bucket: 'mkpremium-files',
    Key: 'phones.csv'
  }).createReadStream()

  const reader = readline.createInterface({ input: stream })

  return new Promise((resolve, reject) => {
    const phones = []
    reader.on('line', row => {
      const columns = row.split(';')
      if (columns[ 0 ] === 'Nº C') // skip header
        return

      phones.push({
        dni: trim(columns[ 0 ]),
        phones: columns.slice(1).filter(Boolean).map(trim),
      })
    })

    reader.on('error', reject)
    reader.on('close', () => resolve(phones))
  })
    .then(async (phones: any[]) => {
      const sqsClient = new aws.SQS({ region: 'eu-west-1' })
      for (let i = 0; i < phones.length; i += 10) {
        await sendBatch(phones.slice(i, i + 10), sqsClient)
        console.log(`${i + 10}/${phones.length} (${((i + 10) * 100 / phones.length).toFixed(2)}%)`)
      }
    })
}

const QueueUrl = process.env.QUEUE_URL

async function sendBatch (batch: any[], sqsClient: aws.SQS) {
  if (batch.length === 0) {
    return
  }
  return sqsClient.sendMessageBatch({
    QueueUrl: QueueUrl,
    Entries: batch.map(entry => ({
      Id: entry.dni,
      MessageDeduplicationId: entry.dni,
      MessageGroupId: 'portugal_data',
      MessageBody: JSON.stringify(entry),
    }))
  }).promise()
    .then(result => {
      if (result.Failed && result.Failed.length > 0) {
        throw new Error(`Not all messages were sent: ${result.Failed}`)
      }
    })
}

function trim (s: string) {
  return s.replace(/^[\s\-.]+/, '').replace(/[\s\-.]+$/, '')
}
