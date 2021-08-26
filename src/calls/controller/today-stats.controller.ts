import { RequestHandler } from 'express'
import moment from 'moment'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { apply } from 'fp-ts'


export const createTodayStatsController = ({ virtualCallsRepository }: { virtualCallsRepository: VirtualCallsRepository }): RequestHandler =>
  async (req, res) => {
    const since = req.query.since as string || moment().format('YYYY-MM-DD')
    const until = req.query.until as string || moment().add(1, 'day').format('YYYY-MM-DD')

    await pipe(
      apply.sequenceT(TE.ApplyPar)(
        virtualCallsRepository.callsByProvinceBetween(since, until),
        virtualCallsRepository.worksheetsByProvinceBetween(since, until),
      ),
      TE.match(
        error => {
          res.status(500)
          res.json(JSON.stringify(error))
        },
        ([ calls, worksheets ]) => {
          const callsAndWorksheetsByProvince = Object.keys(calls).reduce((acc, province) => ({
              ...acc,
              [ province ]: { ...calls[ province ], fichas: worksheets[ province ] }
            }),
            {}
          )
          res.json(callsAndWorksheetsByProvince)
        },
      )
    )()

  }
