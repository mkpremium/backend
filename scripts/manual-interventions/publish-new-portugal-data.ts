import fs from 'fs'
import readline from 'readline'
import uuid from 'uuid/v4'
import aws from 'aws-sdk'

exec()
  .then(() => {
    process.exit()
  })
  .catch(error => {
    console.error('Oops', { error: error.message, stack: error.stack })
    process.exit(1)
  })

async function exec () {
  const stream = fs.createReadStream(process.env.CSV_PATH)
  const reader = readline.createInterface({ input: stream })

  const buildings = []
  return new Promise((resolve, reject) => {
    reader.on('line', row => {
      const columns = row.split(';')
      if (columns[ 1 ] === 'ID')
        return

      const owners = []
      for (let i = 13; i <= 151; i += 3) {
        if (!columns[ i ])
          break
        owners.push({
          name: trim(columns[ i ]),
          dni: trim(columns[ i + 1 ] || ''),
          address: trim(columns[ i + 2 ] || '')
        })
      }

      const building = {
        id: columns[ columnsMap.buildingId ],
        slug: columns[ columnsMap.slug ],
        address: {
          type: columns[ columnsMap.type ],
          street: trim(columns[ columnsMap.street ]),
          number: columns[ columnsMap.street_number ],
          cadastreReferenceAM: trim(columns[ columnsMap.cadastreReferenceAM ]),
          cadastreReferenceA: trim(columns[ columnsMap.cadastreReferenceA ]),
          city: columns[ columnsMap.city ],
          neighborhood: trim(columns[ columnsMap.neighborhood ]),
          floorArea: columns[ columnsMap.area ],
          usage: columns[ columnsMap.usage ],
          militaryGeo: {
            x: columns[ columnsMap.geoX ],
            y: columns[ columnsMap.geoY ],
          }
        },
        owners
      }
      buildings.push(building)
    })

    reader.on('error', reject)
    reader.on('close', () => resolve(buildings))
  })
    .then(async (buildings: any[]) => {
      const sqsClient = new aws.SQS({ region: 'eu-west-1' })
      for (let i = 0; i < buildings.length; i += 10) {
        await sendBatch(buildings.splice(i, 10), sqsClient)
        console.log(`${i + 10}/${buildings.length} (${((i + 10) * 100 / buildings.length).toFixed(2)}%)`)
      }
    })
}

const QueueUrl = process.env.QUEUE_URL

async function sendBatch (buildingsBatch: any[], sqsClient: aws.SQS) {
  if (buildingsBatch.length === 0) {
    return
  }
  return sqsClient.sendMessageBatch({
    QueueUrl: QueueUrl,
    Entries: buildingsBatch.map(b => ({
      Id: b.id,
      MessageDeduplicationId: b.id,
      MessageGroupId: 'portugal_data',
      MessageBody: JSON.stringify(b),
    }))
  }).promise()
    .then(result => {
      if (result.Failed && result.Failed.length > 0) {
        throw new Error(`Not all messages were sent: ${result.Failed}`)
      }
    })
}

const columnsMap = {
  cadastreReferenceAM: 2,
  cadastreReferenceA: 3,
  type: 4,
  street: 5,
  street_number: 6,
  neighborhood: 7,
  city: 8,
  area: 9,
  usage: 10,
  geoX: 11,
  geoY: 12,
  slug: 156,
  buildingId: 157,
}

function trim (s: string) {
  return s.replace(/^[\s\-.]+/, '').replace(/[\s\-.]+$/, '')
}
