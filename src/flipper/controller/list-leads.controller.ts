import { RequestHandler } from '../../infrastructure/request-handler'
import { FlipperLeadsService } from '../service/flipper-leads.service'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { Logger } from '../../infrastructure/logger'

interface Deps {
  flipperLeadsService: FlipperLeadsService,
  logger: Logger,
}

export function listLeadsController ({ flipperLeadsService, logger }: Deps): RequestHandler {
  return async function (req, res): Promise<void> {
    const { flipperId } = req.params
    return pipe(
      flipperLeadsService.leadsFor({ flipperId }),
      TE.match(
        error => {
          res.status(500).json({
            error: {
              message: error.message
            }
          })
          logger.error('Could not list flipper leads', {
            flipperId,
            error: { message: error.message, stack: error.stack }
          })
        },
        leads => {
          res.json(leads)
        }
      )
    )()
  }
}

