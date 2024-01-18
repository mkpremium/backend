import { wrap } from 'express-promise-wrap'

export const getUserScheduledCallsControllerFactory = ({ scheduledCallsService }) => wrap(async (req, res) => {
  const userId = req.user.id

  const scheduledCalls = await scheduledCallsService.scheduledCallsFor(userId)

  res.json(scheduledCalls)
})
