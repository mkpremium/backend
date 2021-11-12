import { connectCouchbaseBucket } from '../../src/db/connect-couchbase-bucket'
import { initLogger } from '../../src/infrastructure/logger'
import { createDiContainer } from '../../src/infrastructure/dependencies'
import aws from 'aws-sdk'
import { BuildingsRepository } from '../../src/building/repository/buildings.repository'
import { Building } from '../../src/building/building'
import { MetadataRepository } from '../../src/building/repository/metadata.repository'
import { CouchbaseAdapter } from '../../src/db/couchbase.adapter'

const logger = initLogger()
const sqsClient = new aws.SQS({ region: 'eu-west-1' })

connectCouchbaseBucket()
  .then(bucket => createDiContainer(bucket))
  .then((container) => {
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const legacyMetadataRepository = container.resolve('legacyMetadataRepository') as MetadataRepository
    const couchbaseAdapter = container.resolve('couchbaseAdapter') as CouchbaseAdapter

    return loop({ buildingsRepository, legacyMetadataRepository, couchbaseAdapter })
  })
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    logger.error('Something went wrong', { error, errorMessage: error.message })
    process.exit(1)
  })


function loop (container, retries = 2) {
  const { buildingsRepository, legacyMetadataRepository, couchbaseAdapter } = container
  if (retries <= 0) {
    return Promise.resolve()
  }

  return sqsClient.receiveMessage({
    MaxNumberOfMessages: 1,
    QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/metadata-to-delete',
  }).promise()
    .then(async ({ Messages }) => {
      if (!Messages || Messages.length === 0) {
        return loop(container, retries - 1)
      }
      const message = Messages[ 0 ]
      const { buildingId, metadataId } = JSON.parse(message.Body)
      const building = await buildingsRepository.get(buildingId)

      try {
        const updatedBuilding = Building.update(building, {
          metadata: {
            $set: building.metadata.filter(({ id }) => id !== metadataId)
          }
        })

        if (updatedBuilding.metadata.length === building.metadata.length) {
          logger.warning('Building without metadata changed', { buildingId, metadataId })
        } else {
          await buildingsRepository.save(updatedBuilding)
          logger.info('Metadata removed from building', { buildingId, metadataId })
          const metadata = await legacyMetadataRepository.findByIdOrThrow(metadataId)
          await couchbaseAdapter.remove(metadataId)

          logger.info('Metadata entity removed', metadata)
        }
      } catch (error) {
        logger.error('Error processing message', {
          buildingId,
          metadataId,
          error: error,
          errorMessage: error.message,
          messageId: message.MessageId,
        })
      }

      return loop(container)
    })
}
