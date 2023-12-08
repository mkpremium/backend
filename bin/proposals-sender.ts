import '../src/infrastructure/o11y/honeycomb'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { initLogger } from '../src/infrastructure/logger'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { ProposalsSenderService } from '../src/building/service/proposals-sender.service'

const logger = initLogger()
logger.info('Starting proposals sender')

createDiContainer('couchbase')
  .then(container => {
    const service = container.resolve('proposalsSenderService') as ProposalsSenderService
    logger.info('Starting to process pending proposals')
    return service.checkAndSendProposals()
  })
  .then((stats) => {
    logger.info('Pending proposals processed', stats)
    process.exit(0)
  })
  .catch(error => {
    logger.crit('Starting proposals sender', { message: error.message, stack: error.stack })
    process.exit(1)
  })

