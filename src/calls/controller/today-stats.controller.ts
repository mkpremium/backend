import { RequestHandler } from 'express'
import moment from 'moment'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'

export const createTodayStatsController = ({ virtualCallsRepository }: { virtualCallsRepository: VirtualCallsRepository }): RequestHandler =>
  (req, res) => {
    return virtualCallsRepository.callsInRange(moment().startOf('day').toDate(), moment().endOf('day').toDate())
      .then(result => {
        res.json(result)
      })
  }
