import _ from 'lodash'
import { ClientError } from '../../infrastructure/http'

/**
 * * @param {TakeNextWorksheetService} takeNextWorksheetService
 */
export const createGetNextCallerWorksheetController = ({ takeNextWorksheetService }) => (req, res) => {
  const callerId = _.get(req, 'user.id')
  const callerAssignedQueueId = _.get(req, 'user.operator.profile.queueId')
  if (!callerAssignedQueueId) {
    return Promise.reject(new ClientError('Caller without a queue assigned cannot take a worksheet.'))
  }

  return takeNextWorksheetService.nextWorksheetInQueueOfId(callerAssignedQueueId, callerId)
    .then((nextWorksheet) => {
      res.json(nextWorksheet)
    })
}
