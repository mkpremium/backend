import { initLogger } from '../../src/infrastructure/logger'
import { createDiContainer } from '../../src/infrastructure/dependencies'
import {
  UpdateBuildingNegotiationStatusService
} from '../../src/building/service/update-building-negotiation-status.service'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { fromPromise } from '../../src/infrastructure/fp-utils'
import aws from 'aws-sdk'
import { CouchbaseBuildingsReadRepository } from "../../src/building/repository/couchbase-buildings-read.repository";

const logger = initLogger()
const sqsClient = new aws.SQS({ region: 'eu-west-1' })

createDiContainer('couchbase')
  .then((container) => {
    return loop(container)
  })
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    logger.error('Something went wrong', { error, errorMessage: error.message })
    process.exit(1)
  })

function loop (container, counter = { success: 0, error: 0 }, retries = 2) {
  if (retries <= 0) {
    return Promise.resolve()
  }
  const buildingsReadRepository = container.resolve('couchbaseBuildingsReadRepository') as CouchbaseBuildingsReadRepository
  const updateBuildingNegotiationStatusService = container.resolve('updateBuildingNegotiationStatusService') as UpdateBuildingNegotiationStatusService

  return sqsClient.receiveMessage({
    MaxNumberOfMessages: 1,
    QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/metadata-to-delete',
  }).promise()
    .then(({ Messages }) => {
      if (!Messages || Messages.length === 0) {
        return loop(container, counter, retries - 1)
      }
      const { cadastreReference } = JSON.parse(Messages[ 0 ].Body)
      return pipe(
        buildingsReadRepository.ofCadastreReference(cadastreReference),
        TE.chain(building => {
          if (!building) {
            logger.warning('Building not found', { cadastreReference })
            return TE.of(undefined)
          }
          return fromPromise(updateBuildingNegotiationStatusService.updateBuildingStatus(building.id, {
            status: 'DESCARTADO',
            userId: 'SYSTEM',
            sourceOwnerId: undefined,
          }))
        }),
        TE.match(
          error => {
            logger.error('Error processing message', { cadastreReference, error: error.message })
            return loop(container, { ...counter, error: counter.error + 1 })
          },
          () => {
            return sqsClient.deleteMessage({
              QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/173249668334/metadata-to-delete',
              ReceiptHandle: Messages[ 0 ].ReceiptHandle,
            }).promise().then(() => loop(container, { ...counter, success: counter.success + 1 }))
          }
        )
      )()
    })
}
