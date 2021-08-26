import { RequestHandler } from 'express'
import moment from 'moment'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { pipe } from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import { apply } from 'fp-ts'


export const createTodayStatsController = ({ virtualCallsRepository }: { virtualCallsRepository: VirtualCallsRepository }): RequestHandler =>
  async (req, res) => {
    const since = moment().startOf('day').toDate()
    const until = moment().endOf('day').toDate()

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
          console.log({calls, worksheets})
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
